import { useDroppable } from "@dnd-kit/core";
import { FileIcon, Plus, Trash2 } from "lucide-react";
import { Extensions } from "../models/extensionsModel";
import { Files } from "../models/filesModel";


type groupSquareProps = {
    id: number;
    groupName: string,
    extensions: Extensions;
    files: Files;
    onDelete: () => void,
};

const GroupSquare = ({ id, groupName, extensions, files, onDelete }: groupSquareProps) => {
    const { setNodeRef } = useDroppable({
        id: id
    });
    return (
        <div ref={setNodeRef} className="border-2 border-base-100-50 border-dotted p-5 grid gap-2">
            <div className="flex justify-between items-center">
                <p className="text-left">{groupName}</p>
                <button onClick={onDelete} className="btn btn-ghost btn-error">
                    <Trash2 size={16} className="text-darker" />
                </button>
            </div>
            {extensions != null && files != null && extensions.getExtensionsCount() == 0 && files.getFilesCount() == 0 &&
                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="border-2 border-base-100-50 rounded-full p-1 flex items-center justify-center">
                        <Plus className="text-success" />
                    </div>
                    <span className="text-center text-sm text-darker">Drop files here</span>
                </div>
            }
            {extensions.getExtensionsCount() > 0 ?
                <div>
                    <p className="text-left text-xs text-darker">Extensions: </p>
                    <div className="flex justify-start gap-2 flex-wrap items-center p-2">
                        {extensions.map(extension =>
                            <div className="tooltip" data-tip={`${extension.count} files`}>
                                <div className="badge badge-soft badge-primary">.{extension.name}</div>
                            </div>)}
                    </div>
                </div>
                : null}
            {files.getFilesCount() > 0 ?
                <div>
                    <p className="text-left text-xs text-darker">Files: </p>
                    <div className={`grid grid-cols-1 gap-2 overflow-x-hidden`}>
                        {files.map(file => <div className="text-left bg-base-100 hover:brightness-200 hover:cursor-move p-2 grid grid-cols-10 items-center gap-5">

                            <FileIcon className='text-accent col-span-2' />
                            <div className="flex flex-col col-span-7">
                                <p className="line-clamp-2 break-all text-sm max-w-[180px]">{file.name}</p>
                                <p className="text-darker text-xs">{(file.size / (1024)).toFixed(1)} MB</p>
                            </div>
                        </div>)}
                    </div>
                </div>
                : null}
        </div>
    );
};

export default GroupSquare;