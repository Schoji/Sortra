import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { getIconByExtension } from "../functions/getIcon";
import { motion } from "motion/react";

type extensionSquareProps = {
    id: number;
    extensionName: string,
    extensionCount: number;
    isDragging: boolean;
};

const ExtensionSquare = ({ id, extensionName, extensionCount, isDragging }: extensionSquareProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `extension-${id}`
    });

    const style = transform ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        touchAction: "none", // Prevents scrolling while dragging on touch devices
    } : { touchAction: "none" };

    return (
        <motion.div
            transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.05
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{
                scale: 1.02,
                x: 0,
                transition: { type: "spring", stiffness: 300 },
            }}
            whileTap={{ scale: 0.98 }}
            className={`shadow-sm cursor-grab p-5 bg-base-100 hover:bg-base-100-50 rounded-xl flex flex-col items-center justify-center gap-2 ${isDragging ? "opacity-0" : "opacity-100"}`}
            key={id}
            style={{ position: "relative", ...style }}
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onTouchMove={e => e.stopPropagation()}
        >
            <GripVertical size={12} className="text-darker" />
            {(() => {
                const fileExtension = "." + extensionName.split(".")[extensionName.split(".").length - 1];
                const IconComponent = getIconByExtension(fileExtension);
                return <IconComponent className="text-accent" size={12} />;
            })()}
            <p className="text-sm">{`.${extensionName}`}</p>
            <p className="text-xs text-darker">{`${extensionCount} files`}</p>
        </motion.div>
    );
};

export default ExtensionSquare;