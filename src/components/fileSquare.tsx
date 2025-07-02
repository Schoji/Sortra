import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { formatBytes } from '../functions/formatBytes';
import { getIconByExtension } from '../functions/getIcon';

type FileSquareProps = {
    id: number;
    order: number;
    fileName: string;
    fileSize: number;
    isDragging: boolean;
};

const FileSquare = ({ id, order, fileName, fileSize, isDragging }: FileSquareProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `file-${id}`
    });

    const style = transform ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        touchAction: "none", // Prevents scrolling while dragging on touch devices
    } : { touchAction: "none" };

    const fileExtension = "." + fileName.split(".")[fileName.split(".").length - 1];

    return (
        <motion.div
            ref={setNodeRef}
            className="max-w-full"
            data-tip={fileName}
            transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.05 + 0.01 * order,
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{
                scale: 1.02,
                x: 5,
                transition: { type: "spring", stiffness: 300 },
            }}
            whileTap={{ scale: 0.98 }}

        >
            <div className={`shadow-sm text-left bg-base-100 hover:bg-base-100-50 cursor-grab p-2 grid grid-cols-[min-content_min-content_1fr] items-center gap-5 ${isDragging ? "opacity-0" : "opacity-100"}`}
                style={{ position: "relative", ...style }}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                onTouchMove={e => e.stopPropagation()}>
                <GripVertical size={16} className="text-darker" />
                {(() => {
                    const IconComponent = getIconByExtension(fileExtension);
                    return <IconComponent className="text-accent" />;
                })()}
                <div className="flex flex-col">
                    <p className="line-clamp-2 break-all text-sm">{fileName}</p>
                    <p className="text-darker text-xs">{formatBytes(fileSize)}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default FileSquare;
