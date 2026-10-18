import { useRef, type RefObject, type PointerEvent, type MouseEvent } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';

export function useDragScroll(ref:RefObject<HTMLElement>){
  const gesture=useRef<{id:number;x:number;scroll:number;dragged:boolean}>();
  return {
    onDragStart:(event:MouseEvent)=>event.preventDefault(),
    onPointerDown:(event:PointerEvent<HTMLElement>)=>{
      if(event.pointerType!=='mouse'||event.button!==0||(event.target as HTMLElement).closest('input,select'))return;
      gesture.current={id:event.pointerId,x:event.clientX,scroll:ref.current?.scrollLeft||0,dragged:false};
    },
    onPointerMove:(event:PointerEvent<HTMLElement>)=>{
      const current=gesture.current,element=ref.current;
      if(!current||!element||!event.buttons)return;
      const distance=event.clientX-current.x;
      if(Math.abs(distance)>7)current.dragged=true;
      if(!current.dragged)return;
      element.setPointerCapture(event.pointerId);element.dataset.dragging='true';element.scrollLeft=current.scroll-distance;event.preventDefault();
    },
    onPointerUp:(event:PointerEvent<HTMLElement>)=>{delete event.currentTarget.dataset.dragging;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);},
    onPointerCancel:()=>{if(ref.current)delete ref.current.dataset.dragging;gesture.current=undefined;},
    onClickCapture:(event:MouseEvent)=>{if(gesture.current?.dragged){event.preventDefault();event.stopPropagation();gesture.current=undefined;}},
  };
}

export function useCarouselDrag(move:(direction:number)=>void){
  const gesture=useRef<{x:number;id:number;dragged:boolean}>();
  const offset=useMotionValue(0),reduced=useReducedMotion();
  const settle=()=>{animate(offset,0,{duration:reduced?0:.48,ease:[.22,.75,.2,1]});};
  return {
    dragging:gesture,
    offset,
    handlers:{
      onDragStart:(event:MouseEvent)=>event.preventDefault(),
      onPointerDown:(event:PointerEvent<HTMLElement>)=>{
        if(event.button!==0||(event.target as HTMLElement).closest('button,input,select'))return;
        offset.stop();
        gesture.current={x:event.clientX,id:event.pointerId,dragged:false};
      },
      onPointerMove:(event:PointerEvent<HTMLElement>)=>{const current=gesture.current;if(!current||current.id!==event.pointerId||!event.buttons)return;const distance=event.clientX-current.x;if(Math.abs(distance)>8){current.dragged=true;event.currentTarget.setPointerCapture(event.pointerId);offset.set(distance);}},
      onPointerUp:(event:PointerEvent<HTMLElement>)=>{const current=gesture.current;if(!current||current.id!==event.pointerId)return;const distance=event.clientX-current.x;if(current.dragged&&Math.abs(distance)>50)move(distance<0?1:-1);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);settle();requestAnimationFrame(()=>{if(gesture.current===current)gesture.current=undefined;});},
      onPointerCancel:()=>{gesture.current=undefined;settle();},
      onClickCapture:(event:MouseEvent)=>{if(gesture.current?.dragged){event.preventDefault();event.stopPropagation();gesture.current=undefined;}},
    },
  };
}
