import {TRACKS} from './soundtrack.js';

// Jukebox controls are attached to the existing settings modal without replacing
// any game, Quest, controller or multiplayer navigation.
export function mountSoundtrackControls({audio,settings,apply,save}){
  const grid=document.querySelector('#settings-screen .settings-grid');
  if(!grid||document.getElementById('soundtrack-panel'))return;
  const field=document.createElement('fieldset');
  field.className='controller-section soundtrack-panel';
  field.id='soundtrack-panel';
  field.innerHTML='<legend>Φ369 JUKEBOX / ORIGINAL 18-TRACK ALBUM</legend>'+
    '<p>The original MichaelWave369 soundtrack plays from this game, one MP3 at a time. Browser audio needs a first interaction. If files are missing, BTM falls back to its procedural music. Solo sound effects are always preserved.</p>'+
    '<label class="setting-row" for="soundtrack-mode">Music source<select id="soundtrack-mode"><option value="album">ORIGINAL ALBUM / AUTO FALLBACK</option><option value="procedural">PROCEDURAL / RETRO SYNTH</option></select></label>'+
    '<label class="setting-row" for="soundtrack-track">Jukebox playback<select id="soundtrack-track"></select></label>'+
    '<div class="soundtrack-buttons"><button type="button" id="soundtrack-play">PLAY / UNLOCK AUDIO</button><button type="button" id="soundtrack-next">NEXT TRACK</button></div>'+
    '<p id="soundtrack-status" role="status" aria-live="polite">Ready for local album playback.</p>';
  grid.append(field);
  const mode=field.querySelector('#soundtrack-mode');
  const choice=field.querySelector('#soundtrack-track');
  for(const [value,label] of [['auto','AUTO / MATCH THE GAME'],['album','PLAY ALL 18 IN ORDER'],...TRACKS.map(t=>[String(t.id),String(t.id).padStart(2,'0')+' / '+t.title])]){
    const opt=document.createElement('option');opt.value=value;opt.textContent=label;choice.append(opt);
  }
  const status=field.querySelector('#soundtrack-status');
  const render=()=>{mode.value=settings.soundtrackMode||'album';choice.value=settings.soundtrackTrack||'auto';status.textContent='STATUS / '+audio.album.label.toUpperCase()+(audio.album.unavailable?' / FILES NOT INSTALLED':'');};
  mode.addEventListener('change',()=>{settings.soundtrackMode=mode.value;apply();save();render();});
  choice.addEventListener('change',()=>{settings.soundtrackTrack=choice.value;apply();save();render();});
  field.querySelector('#soundtrack-play').addEventListener('click',()=>{audio.start();audio.album.sync();render();});
  field.querySelector('#soundtrack-next').addEventListener('click',()=>{
    const current=Number(settings.soundtrackTrack)||audio.album.current?.track.id||1;
    settings.soundtrackTrack=String(current>=18?1:current+1);settings.soundtrackMode='album';
    apply();save();audio.start();render();
  });
  setInterval(()=>{if(!document.getElementById('settings-screen')?.hidden)render();},1500);
  render();
}
