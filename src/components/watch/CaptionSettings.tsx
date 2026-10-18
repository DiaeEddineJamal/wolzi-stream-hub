import { ChoiceSelect } from '@/components/ui/select';
import { defaultCaptions, type CaptionPreferences } from '@/lib/captions';
export default function CaptionSettings({value,onChange}:{value:CaptionPreferences;onChange:(value:CaptionPreferences)=>void}){
  return <details className="caption-customize"><summary>Customize subtitles</summary>
    <label className="caption-setting">Size · {value.size}%<input aria-label="Subtitle size" type="range" min={75} max={200} step={5} value={value.size} onChange={event=>onChange({...value,size:Number(event.target.value)})}/></label>
    <div className="caption-setting"><span>Text color</span><div className="caption-colors">{[['#ffffff','White'],['#ffd166','Gold'],['#b8e0c5','Mint']].map(([color,label])=><button key={color} aria-label={label+' subtitles'} aria-pressed={value.color===color} style={{backgroundColor:color}} onClick={()=>onChange({...value,color})}/>)}<input aria-label="Subtitle color" type="color" value={value.color} onChange={event=>onChange({...value,color:event.target.value})}/></div></div>
    <label className="caption-setting">Position<ChoiceSelect label="Subtitle position" value={String(value.position)} onValueChange={position=>onChange({...value,position:Number(position)})} options={[{value:"90",label:"Bottom"},{value:"70",label:"Lower middle"},{value:"50",label:"Middle"},{value:"10",label:"Top"}]}/></label>
    <div className="caption-setting"><span>Sync · seconds</span><div className="caption-offset"><button aria-label="Subtitles 0.5 seconds earlier" onClick={()=>onChange({...value,delay:Math.max(-30,value.delay-.5)})}>−</button><output aria-label="Subtitle delay">{value.delay>0?'+':''}{value.delay.toFixed(1)}s</output><button aria-label="Subtitles 0.5 seconds later" onClick={()=>onChange({...value,delay:Math.min(30,value.delay+.5)})}>+</button></div></div>
    <p className="cinema-menu-note">Positive delay shows captions later. Your preferences are saved on this device.</p><button className="caption-reset" onClick={()=>onChange(defaultCaptions)}>Reset subtitle style & sync</button>
  </details>;
}
