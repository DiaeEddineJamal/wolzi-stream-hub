import { useRef, type ReactNode } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
export default function DraggableRail({children,className}:{children:ReactNode;className:string}){
  const rail=useRef<HTMLDivElement>(null),drag=useDragScroll(rail);
  return <div ref={rail} className={className} {...drag}>{children}</div>;
}
