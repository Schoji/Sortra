import { useDraggable } from "@dnd-kit/core";
import { FolderOpen, GripVertical } from "lucide-react";

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
        <div
            className={`hover:brightness-200 cursor-grab p-5 bg-base-100 rounded-xl flex flex-col items-center justify-center gap-2 ${isDragging ? "opacity-0" : "opacity-100"}`}
            key={id}
            style={{ position: "relative", ...style }}
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onTouchMove={e => e.stopPropagation()}
        >
            <GripVertical size={12} className="text-darker" />
            <FolderOpen size={12} className="text-accent" />
            <p className="text-sm">{`.${extensionName}`}</p>
            <p className="text-xs text-darker">{`${extensionCount} files`}</p>
        </div>
    );
};

export default ExtensionSquare;