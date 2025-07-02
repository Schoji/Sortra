import { useDraggable } from '@dnd-kit/core';
import { GripVertical, LucideProps } from 'lucide-react';
import { motion } from 'motion/react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { formatBytes } from '../functions/formatBytes';

type FileSquareProps = {
    id: number;
    order: number;
    fileIcon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    fileName: string;
    fileSize: number;
    isDragging: boolean;
};

const FileSquare = ({ id, order, fileIcon: FileIcon, fileName, fileSize, isDragging }: FileSquareProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `file-${id}`
    });

    const style = transform ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        touchAction: "none", // Prevents scrolling while dragging on touch devices
    } : { touchAction: "none" };


    return (
        <motion.div
            ref={setNodeRef}
            className="max-w-full"
            data-tip={fileName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.05 + 0.01 * order, // możesz dać np. index * 0.05 jak chcesz sekwencję
            }}
        >
            <div className={`text-left bg-base-100 hover:brightness-200 hover:cursor-move p-2 grid grid-cols-[min-content_min-content_1fr] items-center gap-5 ${isDragging ? "opacity-0" : "opacity-100"}`}
                style={{ position: "relative", ...style }}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onTouchMove={e => e.stopPropagation()}>
                <GripVertical size={16} className="text-darker" />
                <FileIcon className='text-accent' />
                <div className="flex flex-col">
                    <p className="line-clamp-2 break-all text-sm">{fileName}</p>
                    <p className="text-darker text-xs">{formatBytes(fileSize)}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default FileSquare;
