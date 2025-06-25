import { FolderOpen, GripVertical } from "lucide-react";

type extensionSquareProps = {
    extensionName: string,
    extensionCount: number;

};

const ExtensionSquare = ({ extensionName, extensionCount }: extensionSquareProps) => {
    return (
        <div className="hover:brightness-200 hover:cursor-move p-5 bg-base-100 rounded-xl flex flex-col items-center justify-center gap-2" key={extensionName}>
            <GripVertical size={12} className="text-darker" />
            <FolderOpen size={12} className="text-accent" />
            <p className="text-sm">{`.${extensionName}`}</p>
            <p className="text-xs text-darker">{`${extensionCount} files`}</p>
        </div>
    );
};

export default ExtensionSquare;