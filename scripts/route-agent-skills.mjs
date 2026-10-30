import {readFile, access} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const slugs = Object.freeze([
  'btm-router',
  'btm-quest3-input',
  'btm-xr-comfort',
  'btm-genewrist',
  'fps-shooter',
  'input-systems',
  'performance-optimization'
]);
const rules = Object.freeze([
  ['btm-quest3-input', /\b(quest|touch|controller|controllers|thumbstick|joystick|turn|turning|input|rearm|grip|trigger|deadzone)\b/i],
  ['btm-xr-comfort', /\b(comfort|vignette|nausea|motion sickness|ori|wrist alignment|flicker|flashing|low fps|fps drops|fps stutter|frame drops|frame rate|frame pacing|framerate|latency|performance|calibration|stutter|headset|xr|vr|stereo)\b/i],
  ['btm-genewrist', /\b(gen[. -]?e[. -]?wrist|wrist|world mode|realm atlas|realm|3\/6\/9|travel|bridge)\b/i],
  ['fps-shooter', /\b(shooter|combat|weapons?|firing|shoot|shooting|enemies|enemy|boss|projectiles?|aim|recoil|damage|hitmarkers?)\b/i],
  ['input-systems', /\b(controller|controllers|thumbstick|joystick|turn|turning|input|rearm|grip|trigger|deadzone|rebind|gamepad)\b/i],
  ['performance-optimization', /\b(performance|optimi[sz]e|low fps|fps drops|fps stutter|frame drops|framerate|frame rate|frame pacing|stutter|profiler|draw calls|gpu|cpu|latency)\b/i]
]);
export function skillPath(slug) {
  if (!slugs.includes(slug)) throw new RangeError('Unknown skill: ' + slug);
  return '.agents/skills/' + slug + '/SKILL.md';
}
export async function detectEngine(root = projectRoot) {
  try {
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (pkg.name !== 'michael-wave-ori-break-the-matrix') return 'unknown';
    await Promise.all(['src/immersive-play.js', 'src/vr-input.js', 'src/genewrist-bridge.js']
      .map(p => access(join(root, p))));
    return 'btm-native-webxr';
  } catch {
    return 'unknown';
  }
}
export function selectSkills(task, engine = 'btm-native-webxr') {
  if (typeof task !== 'string') throw new TypeError('Task must be text');
  if (engine !== 'btm-native-webxr') return [];
  const selected = new Set(['btm-router']);
  for (const [slug, pattern] of rules) if (pattern.test(task)) selected.add(slug);
  // Complex XR input work needs both BTM-owned physical mapping and discipline concepts.
  if (selected.has('btm-quest3-input')) selected.add('input-systems');
  return slugs.filter(slug => selected.has(slug)).map(slug => ({name: slug, path: skillPath(slug)}));
}
export async function validateSkills(root = projectRoot) {
  const missing = [];
  for (const slug of slugs) {
    const path = skillPath(slug);
    try {
      const content = await readFile(join(root, path), 'utf8');
      const lines = content.split('\n');
      if (!content.startsWith('---\n') || !lines.includes('name: ' + slug) ||
          !lines.some(line => line.startsWith('description:'))) missing.push(path + ': invalid metadata');
      for (const match of content.matchAll(/`(references[^`]+[.]md)`/g)) {
        const ref = match[1];
        if (!ref.startsWith('references/') || ref.includes('..')) {
          missing.push(path + ': unsafe reference ' + ref);
          continue;
        }
        try { await access(join(root, '.agents/skills', slug, ref)); }
        catch { missing.push(path + ': missing ' + ref); }
      }
    } catch {
      missing.push(path + ': missing');
    }
  }
  return {ok: missing.length === 0, count: slugs.length, missing};
}
export async function routeTask(task, {root = projectRoot, load = false} = {}) {
  const engine = await detectEngine(root);
  if (engine === 'unknown') throw new Error('BTM fingerprint not found; refusing to guess an engine');
  const skills = selectSkills(task, engine);
  const result = {engine, task, skills};
  if (load) result.contents = await Promise.all(skills.map(async item => ({
    name: item.name,
    content: await readFile(join(root, item.path), 'utf8')
  })));
  return result;
}
async function main(argv) {
  const validate = argv.includes('--validate');
  const load = argv.includes('--load');
  const json = argv.includes('--json');
  const i = argv.indexOf('--task');
  if (validate) {
    const result = await validateSkills();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const task = i >= 0 ? argv[i + 1] : argv.filter(arg => !arg.startsWith('--')).join(' ');
  if (!task || task.startsWith('--')) throw new Error('Usage: node scripts/route-agent-skills.mjs --task "describe work" [--json] [--load] or --validate');
  const result = await routeTask(task, {load});
  if (json || load) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('Engine: ' + result.engine);
    console.log('Selected skills (read in order):');
    for (const skill of result.skills) console.log('  ' + skill.path);
  }
}
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
, 'm').test(content) ||
          !/^description:/m.test(content)) missing.push(path + ': invalid metadata');
      for (const match of content.matchAll(/`(references[^`]+[.]md)`/g)) {
        const ref = match[1];
        if (!ref.startsWith('references/') || ref.includes('..')) { missing.push(path + ': unsafe reference ' + ref); continue; }
        try { await access(join(root, '.agents/skills', slug, ref)); }
        catch { missing.push(path + ': missing ' + ref); }
      }
    } catch {
      missing.push(path + ': missing');
    }
  }
  return {ok: missing.length === 0, count: slugs.length, missing};
}
export async function routeTask(task, {root = projectRoot, load = false} = {}) {
  const engine = await detectEngine(root);
  if (engine === 'unknown') throw new Error('BTM fingerprint not found; refusing to guess an engine');
  const skills = selectSkills(task, engine);
  const result = {engine, task, skills};
  if (load) result.contents = await Promise.all(skills.map(async item => ({
    name: item.name,
    content: await readFile(join(root, item.path), 'utf8')
  })));
  return result;
}
async function main(argv) {
  const validate = argv.includes('--validate');
  const load = argv.includes('--load');
  const json = argv.includes('--json');
  const i = argv.indexOf('--task');
  if (validate) {
    const result = await validateSkills();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const task = i >= 0 ? argv[i + 1] : argv.filter(arg => !arg.startsWith('--')).join(' ');
  if (!task || task.startsWith('--')) throw new Error('Usage: node scripts/route-agent-skills.mjs --task "describe work" [--json] [--load] or --validate');
  const result = await routeTask(task, {load});
  if (json || load) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('Engine: ' + result.engine);
    console.log('Selected skills (read in order):');
    for (const skill of result.skills) console.log('  ' + skill.path);
  }
}
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
