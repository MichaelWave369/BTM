// Read-only stage progress for the Episodes picker. No save writes or schema
// changes. A checkpoint only contributes progress after the same integrity
// validator used by the episode restore path accepts it.
import {validEpisodeCheckpoint} from './progression.js';

export function episodeProgress(episode, checkpoint) {
  const count=episode.stages.length;
  let valid=false;
  try {valid=!!checkpoint&&validEpisodeCheckpoint(checkpoint,episode);} catch {valid=false;}
  if(!valid){
    const invalid=checkpoint!=null;
    return {
      status:invalid?'CHECKPOINT UNAVAILABLE':'NEW EPISODE',
      next:invalid?'Existing save was not changed. Starting a new run replaces it.':'Start at '+episode.stages[0].name,
      completed:0,total:count,valid:false,hasCheckpoint:invalid,
      markers:episode.stages.map((stage,index)=>({
        number:index+1,name:stage.name,state:index===0&&!invalid?'current':'locked'
      }))
    };
  }
  const index=checkpoint.levelIndex;
  const completed=Math.min(count,index+(checkpoint.episodeCleared?1:0));
  const finished=completed===count;
  const focus=finished?-1:completed;
  const upcoming=episode.stages[focus];
  return {
    status:finished?'EPISODE CLEARED':checkpoint.episodeCleared?
      'STAGE '+String(index+1).padStart(2,'0')+' CLEARED':
      'STAGE '+String(index+1).padStart(2,'0')+' IN PROGRESS',
    next:finished?'All '+count+' stages complete. Replay whenever you like.':
      (checkpoint.episodeCleared?'Next: ':'Resume: ')+upcoming.name,
    completed,total:count,valid:true,hasCheckpoint:true,
    markers:episode.stages.map((stage,i)=>({
      number:i+1,name:stage.name,state:i<completed?'complete':i===focus?'current':'locked'
    }))
  };
}
