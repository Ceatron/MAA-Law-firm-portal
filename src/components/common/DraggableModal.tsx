import React, { ReactNode } from 'react';
import { motion, useDragControls } from 'motion/react';
import { GripHorizontal } from 'lucide-react';

interface DraggableModalProps {
  children: ReactNode;
  className?: string;
  id?: string;
  showGripBar?: boolean;
  gripLabel?: string;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  children,
  className = '',
  id,
  showGripBar = true,
  gripLabel,
}) => {
  const dragControls = useDragControls();

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest('button, input, select, textarea, a, [role="button"], label, .no-drag')
    ) {
      return;
    }
    dragControls.start(e);
  };

  return (
    <motion.div
      id={id}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      className={`relative select-text ${className}`}
    >
      {showGripBar && (
        <div
          onPointerDown={handlePointerDown}
          className="w-full bg-[#0f1113] hover:bg-[#08090a] text-stone-400 hover:text-stone-200 py-1 px-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none text-[10px] font-mono tracking-wider transition-colors border-b border-stone-800/80 shrink-0"
          title="Click and drag to move modal"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="h-3.5 w-3.5 text-stone-400" />
            <span className="uppercase text-[9px] font-semibold text-stone-300 tracking-wider">
              {gripLabel || 'DRAGGABLE DIALOG'}
            </span>
          </div>
          <span className="text-[9px] text-stone-500">Hold & drag to reposition</span>
        </div>
      )}
      <div
        onPointerDown={(e) => {
          const target = e.target as HTMLElement | null;
          if (
            target &&
            (target.closest('.modal-drag-handle') || target.closest('[data-drag-handle="true"]')) &&
            !target.closest('button, input, select, textarea, a, [role="button"]')
          ) {
            handlePointerDown(e);
          }
        }}
        className="contents"
      >
        {children}
      </div>
    </motion.div>
  );
};
