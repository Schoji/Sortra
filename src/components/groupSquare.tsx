import { useDroppable } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";
import { Extensions } from "../models/extensionsModel";
import { Files } from "../models/filesModel";
import { formatBytes } from "../functions/formatBytes";
import { getIconByExtension } from "../functions/getIcon";
import { motion } from "motion/react";
import { useState } from "react";


type groupSquareProps = {
    id: number;
    groupName: string,
    extensions: Extensions;
    files: Files;
    onDelete: () => void,
    onExtensionRemove: (extensionId: number) => void;
    onFileRemove: (fileId: number) => void;
    onGroupNameChange: (event: any, previousName: string, id: number) => void;
};

const GroupSquare = ({ id, groupName, extensions, files, onDelete, onExtensionRemove, onFileRemove, onGroupNameChange }: groupSquareProps) => {
    const [inputField, setInputField] = useState(groupName);

    const [previousName, setPreviousName] = useState(groupName);

    const { setNodeRef } = useDroppable({
        id: id
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.2,
            }}
            ref={setNodeRef}
            className="border-2 border-base-100-50 border-dotted p-4 grid grid-rows-[min-content_min-content_auto] gap-2 shadow-sm min-h-80">
            <div className="flex justify-between items-center">
                <input
                    className="text-left bg-base-100 rounded-md outline-none border-none focus:ring-0 p-2 w-full"
                    pattern={"^(?!^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$)[^\\\\/:*?\"<>|.\\s][^\\\\/:*?\"<>|]{0,254}[^\\\\/:*?\"<>|.\\s]$"}
                    required
                    value={inputField}
                    onChange={(e) => setInputField(e.target.value)}
                    onBlur={(e) => onGroupNameChange(e, previousName, id)}
                    onFocus={(e) => setPreviousName(e.target.value)}
                />
                <button onClick={onDelete} className="btn btn-ghost btn-error p-4">
                    <Trash2 size={16} className="text-darker" />
                </button>
            </div>
            {extensions != null && files != null && extensions.getExtensionsCount() == 0 && files.getFilesCount() == 0 &&
                <div className="flex flex-col items-center justify-center gap-2 row-span-6">
                    <div className="border-2 border-base-100-50 rounded-full p-1 flex items-center justify-center">
                        <Plus className="text-success" />
                    </div>
                    <span className="text-center text-sm text-darker">Drop files here</span>
                </div>
            }
            {extensions.getExtensionsCount() > 0 ?
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.5,
                    }}
                >
                    <p className="text-left text-xs text-darker">Extensions: </p>
                    <div className="flex justify-start gap-2 flex-wrap items-center pt-2">
                        {extensions.map(extension =>
                            <motion.div
                                key={extension.id}
                                className="group relative"
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: "easeOut"
                                }}>

                                <div className="tooltip" data-tip={`${extension.count} files`}>
                                    <div className="badge badge-soft badge-primary text-xs xl:text-sm">.{extension.name}</div>
                                    <motion.button
                                        onClick={() => {
                                            extensions.removeExtensionByID(extension.id);
                                            onExtensionRemove(extension.id);
                                        }}
                                        whileHover={{ scale: 1.2, rotate: 90 }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute -top-2 -right-2 bg-error rounded-full w-4 h-4 text-xs hidden group-hover:flex badge badge-xs"
                                    >
                                        ✕
                                    </motion.button>
                                </div>
                            </motion.div>)}
                    </div>
                </motion.div>
                : <div className="-What is my purpose? -To take grid space. -Oh god."></div>}
            {files.getFilesCount() > 0 ?
                <div className="overflow-auto">
                    <p className="text-left text-xs text-darker">Files: </p>
                    <div className={`grid grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] gap-2 pt-2`}>
                        {files.map(file =>
                            <div key={file.id} className="group relative text-left bg-base-100 rounded-md p-2 grid grid-cols-[min-content_1fr] items-center gap-2">
                                {(() => {
                                    const fileExtension = "." + file.name.split(".")[file.name.split(".").length - 1];
                                    const IconComponent = getIconByExtension(fileExtension);
                                    return <IconComponent className="text-accent" />;
                                })()}
                                <div className="flex flex-col">
                                    <p className="line-clamp-2 break-all text-sm max-w-[180px]">{file.name}</p>
                                    <p className="text-darker text-xs">{formatBytes(file.size)}</p>
                                </div>
                                <motion.button
                                    onClick={() => {
                                        files.removeFileByID(file.id);
                                        onFileRemove(file.id);
                                    }}
                                    whileHover={{ scale: 1.2, rotate: 90 }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute right-4 bg-error rounded-full w-4 h-4 text-xs hidden group-hover:flex badge badge-xs"
                                >
                                    ✕
                                </motion.button>
                            </div>)}
                    </div>
                </div>
                : null}
        </motion.div>
    );
};

export default GroupSquare;