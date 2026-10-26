// Audio-driven subtitle alignment: correlate detected speech with subtitle cue coverage
// to find the offset (and frame-rate scale) that best matches the dialogue actually heard.
export interface SyncCue {start:number;end:number;text?:string}
export interface SubtitleAlignment {offset:number;scale:number;score:number;confidence:number;observed:number}
export const SYNC_STEP=0.1;
// PAL speed-up and NTSC pulldown are the usual causes of subtitles that drift over a whole video.
export const FRAME_RATIOS=[1,25/23.976,23.976/25,25/24,24/25,24/23.976,23.976/24];
const MIN_OBSERVED=60,MAX_SAMPLES=3000,COARSE=0.25,FINE=0.05;

const clockTime=(value:string)=>{const parts=value.replace(',','.').split(':').map(Number);return parts.reduce((total,part)=>total*60+part,0);};
const TIMING=/^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/;
export function parseVttCues(text:string):SyncCue[]{
  const cues:SyncCue[]=[];
  for(const block of text.replace(/\r\n?/g,'\n').split(/\n{2,}/)){
    const lines=block.split('\n'),index=lines.findIndex(line=>TIMING.test(line));
    if(index<0)continue;
    const match=TIMING.exec(lines[index])!,start=clockTime(match[1]),end=clockTime(match[2]);
    const raw=lines.slice(index+1).join('\n').replace(/<[^>]*>/g,'').trim();
    // Sound descriptions and music-only lines are not dialogue and would mislead alignment.
    const spoken=raw.replace(/\[[^\]]*\]|\([^)]*\)|[♪♫#*]/g,'').trim();
    if(Number.isFinite(start)&&end>start&&spoken)cues.push({start,end,text:raw});
  }
  return cues.sort((a,b)=>a.start-b.start);
}

export class SpeechTimeline {
  private bins=new Map<number,{sum:number;count:number}>();
  record(time:number,energy:number){
    if(!Number.isFinite(time)||time<0||!Number.isFinite(energy))return;
    const bin=Math.floor(time/SYNC_STEP),entry=this.bins.get(bin);
    if(entry){entry.sum+=energy;entry.count++;}else this.bins.set(bin,{sum:energy,count:1});
  }
  get observed(){return this.bins.size*SYNC_STEP;}
  clear(){this.bins.clear();}
  // Speech likelihood per observed bin, relative to the local noise floor so loud scenes don't dominate.
  activity(){
    const bins=[...this.bins.keys()].sort((a,b)=>a-b),energy=bins.map(bin=>{const entry=this.bins.get(bin)!;return entry.sum/entry.count;});
    const chunks=new Map<number,number[]>();
    bins.forEach((bin,i)=>{const chunk=Math.floor(bin/100);if(!chunks.has(chunk))chunks.set(chunk,[]);chunks.get(chunk)!.push(energy[i]);});
    const floors=new Map<number,number>();
    chunks.forEach((values,chunk)=>{const sorted=[...values].sort((a,b)=>a-b);floors.set(chunk,sorted[Math.floor(sorted.length*.15)]);});
    const values=bins.map((bin,i)=>{
      const chunk=Math.floor(bin/100);
      const floor=Math.min(...[chunk-1,chunk,chunk+1].flatMap(c=>floors.has(c)?[floors.get(c)!]:[]));
      return Math.max(0,Math.min(1,(energy[i]-floor-3)/9));
    });
    return {times:bins.map(bin=>(bin+.5)*SYNC_STEP),values};
  }
}

function coverageGrid(cues:SyncCue[]){
  const last=cues.reduce((max,cue)=>Math.max(max,cue.end),0),grid=new Uint8Array(Math.ceil(last/SYNC_STEP)+2);
  // Cues linger after the line is spoken; weighting onsets keeps the estimate from drifting early.
  for(const cue of cues){const end=cue.end-Math.min(.4,(cue.end-cue.start)*.25);for(let i=Math.floor(cue.start/SYNC_STEP);i<Math.ceil(end/SYNC_STEP);i++)grid[i]=1;}
  return grid;
}

export function estimateAlignment(cues:SyncCue[],timeline:SpeechTimeline,maxOffset=60):SubtitleAlignment|undefined{
  if(timeline.observed<MIN_OBSERVED||cues.length<8)return undefined;
  const activity=timeline.activity(),stride=Math.ceil(activity.times.length/MAX_SAMPLES);
  const times:number[]=[],values:number[]=[];
  for(let i=0;i<activity.times.length;i+=stride){times.push(activity.times[i]);values.push(activity.values[i]);}
  const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n,centered=values.map(value=>value-mean);
  const varianceX=centered.reduce((a,b)=>a+b*b,0);
  if(varianceX<n*.01)return undefined; // Silence or a constant signal: nothing to align against.
  const grid=coverageGrid(cues),span=times[n-1]-times[0];
  const correlation=(offset:number,scale:number)=>{
    let covered=0,product=0;
    for(let i=0;i<n;i++){const index=Math.floor((times[i]-offset)/scale/SYNC_STEP);if(index>=0&&index<grid.length&&grid[index]){covered++;product+=centered[i];}}
    const varianceC=covered-covered*covered/n;
    return varianceC>0?product/Math.sqrt(varianceX*varianceC):0;
  };
  let best:SubtitleAlignment|undefined,unscaled=0;
  for(const scale of FRAME_RATIOS){
    // A scale only becomes observable once it moves cues by more than a second across what was heard.
    if(scale!==1&&span*Math.abs(scale-1)<1.5)continue;
    const steps=Math.round(maxOffset/COARSE),curve=new Float64Array(steps*2+1);
    let peak=0;
    for(let i=0;i<curve.length;i++){curve[i]=correlation((i-steps)*COARSE,scale);if(curve[i]>curve[peak])peak=i;}
    let offset=(peak-steps)*COARSE,score=curve[peak];
    for(let fine=offset-COARSE;fine<=offset+COARSE+1e-9;fine+=FINE){const value=correlation(fine,scale);if(value>score){score=value;offset=fine;}}
    // Confidence: how far the peak stands above every alignment that is clearly different.
    const others=Array.from(curve).filter((_,i)=>Math.abs(i-peak)*COARSE>2);
    const otherMean=others.reduce((a,b)=>a+b,0)/others.length;
    const deviation=Math.sqrt(others.reduce((a,b)=>a+(b-otherMean)**2,0)/others.length)||1e-6;
    const runnerUp=Math.max(...others);
    const confidence=Math.min((score-otherMean)/deviation/8,(score-runnerUp)/.08,1);
    if(scale===1)unscaled=score;
    // Changing frame rate must clearly beat the plain offset, not just match it.
    if(scale!==1&&score<unscaled*1.1+.02)continue;
    if(!best||score>best.score)best={offset:Math.round(offset*100)/100,scale,score,confidence:Math.max(0,confidence),observed:timeline.observed};
  }
  return best&&best.score>=.12&&best.confidence>=.5?best:undefined;
}

export function displayedCueStart(cue:SyncCue,alignment:Pick<SubtitleAlignment,'offset'|'scale'>|undefined,manual=0){
  return cue.start*(alignment?.scale??1)+(alignment?.offset??0)+manual;
}
