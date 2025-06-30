import { CircleCheckBig, File, Folder, Terminal } from "lucide-react";
import { Groups } from "../models/groupsModel";
import { Files } from "../models/filesModel";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from '@tauri-apps/api/event';
type modalProps = {
    groupList: Groups;
    files: Files;
    directory: string;
};
type resultJSON = {
    [group: string]: Array<string>;
};

type progress = {
    value: number,
    max: number;
};

const initialProgress = { value: 0, max: 100 };

const Modal = ({ groupList, files, directory }: modalProps) => {
    const [stage, setStage] = useState(0);
    const [sortLog, setSortLog] = useState<Array<string>>([]);
    const [progress, setProgress] = useState<progress>(initialProgress);

    // Listen for 'sort-log' events when the component mounts
    useEffect(() => {
        let unlistenSortLog: (() => void) | undefined;
        let unlistenProgress: (() => void) | undefined;

        (async () => {
            unlistenSortLog = await listen('sort-log', (event) => {
                setSortLog(prev => {
                    const payloadStr = String(event.payload);
                    if (!prev.includes(payloadStr)) {
                        return [...prev, payloadStr];
                    }
                    return prev;
                });
            });

            unlistenProgress = await listen('sort-progress', (event) => {
                const result: progress = JSON.parse(event.payload as string);
                console.log("RESULT", result);
                setProgress({ "value": result.value, "max": result.max });
                console.log("PROGRESS", progress);
            });
        })();

        return () => {
            if (unlistenSortLog) unlistenSortLog();
            if (unlistenProgress) unlistenProgress();
        };
    }, []);


    async function sort() {
        setProgress(initialProgress);
        setSortLog([]);
        const result: resultJSON = {};
        groupList.getGroupList().forEach(group => {
            result[group.name] = [];
            group.extensions?.getExtensionList().forEach(extension => {
                const filesFromExtension = files.getFilesByExtension(extension.name).map(file => file.name);
                result[group.name] = [...result[group.name], ...filesFromExtension];
            });
        }
        );
        setStage(1);
        const result1 = await invoke<string[]>('sort', { json: result, dir: directory });
        console.log(result1);
    }
    return (
        <dialog id="my_modal_1" className="modal">
            {stage == 0 ?
                <div className="modal-box grid gap-5 bg-base-200 border-2 border-base-100-50">
                    <div className="grid gap-1">
                        <div className="flex gap-2 items-center">
                            <Folder size={20} className="text-primary" />
                            <h1 className="font-bold text-lg">Sort Summary</h1>
                        </div>
                        <p className="text-darker text-sm">Review what will happend when you sort files into groups.</p>
                    </div>
                    <div className="bg-base-100 p-5 border-2 border-base-100-50 rounded-xl">
                        <h1 className="font-semibold">Actions that will be performed</h1>
                        <ul className="list-disc marker:text-primary grid gap-2 text-xs p-5">
                            <li>Create <span className="text-primary">{groupList.getGroupsCount()}</span> new directories in the selected folder</li>
                            <li>Move <span className="text-primary">{groupList.getGroupList().reduce((total, group) => {
                                const extCount = group.extensions
                                    ? group.extensions.getExtensionList().reduce(
                                        (sum, extension) => sum + files.getFilesByExtension(extension.name).length,
                                        0
                                    )
                                    : 0;
                                const fileCount = group.files ? group.files.getFilesCount() : 0;
                                return total + extCount + fileCount;
                            }, 0)}</span> files to their respective group directories</li>

                            <li>Organize files by their extensions automatically</li>
                        </ul>
                    </div>
                    <h1>What will happen:</h1>
                    {groupList.getGroupList().map(group =>
                        <div className="bg-base-200 p-5 border-2 border-base-100-50 rounded-xl" key={group.id}>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 items-center">
                                    <Folder size={16} className="text-primary" />
                                    <h1 className="font-bold text-sm">{group.name}</h1>
                                </div>
                                <div className="badge badge-soft badge-primary badge-sm">
                                    {(group.extensions
                                        ? group.extensions.getExtensionList().reduce(
                                            (sum, extension) => sum + files.getFilesByExtension(extension.name).length,
                                            0
                                        )
                                        : 0) + (group.files ? group.files.getFilesCount() : 0)}
                                </div>
                            </div>
                            <div className="grid gap-2 p-3">
                                <p className="text-xs text-darker">Extensions to move</p>
                                {group.extensions && group.extensions.map(extension =>
                                    <div className="p-4 flex justify-between items-center bg-base-100 rounded-md" key={extension.id}>
                                        <div className="flex gap-2 items-center">
                                            <File size={16} className="text-accent" />
                                            <p className="text-xs">.{extension.name}</p>
                                            <p className="text-xs">-{">"}</p>
                                            <p className="text-xs text-darker">/{group.name}/</p>
                                        </div>
                                        <div className="badge badge-soft badge-accent badge-xs">{files.getFilesByExtension(extension.name).length}</div>
                                    </div>
                                )}
                                <p className="text-xs text-darker">Files to move</p>
                                <div className="overflow-scroll overflow-x-hidden overflow-y-auto h-24 grid gap-2">
                                    {group.files && group.files.map(file =>
                                        <div className="p-4 flex justify-between items-center bg-base-100 rounded-md" key={file.id}>
                                            <div className="flex gap-2 items-center">
                                                <File size={16} className="text-accent" />
                                                <div className="">
                                                    <p className="text-xs">{file.name}</p>
                                                    <p className="text-xs text-darker">{(file.size / (1024)).toFixed(1)} MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn btn-outline">Cancel</button>
                        </form>
                        <button className="btn btn-primary" onClick={sort}>Sort files</button>
                    </div>
                </div>
                :
                <div className="modal-box grid gap-5 bg-base-300 border-2 border-base-100-50">
                    <div className="grid gap-1">
                        {progress.value != progress.max ?
                            <div className="flex gap-2 items-center">
                                <span className="loading loading-spinner text-primary"></span>
                                <h1 className="font-bold text-lg">Sorting in progress</h1>
                            </div>
                            :
                            <div className="flex gap-2 items-center">
                                <CircleCheckBig className="text-success" />
                                <h1 className="font-bold text-lg">Sort complete</h1>
                            </div>
                        }
                        <p className="text-darker text-sm">
                            {progress.value != progress.max ?
                                "Review what will happend when you sort files into groups."
                                :
                                "Sort completed successfully!"
                            }
                        </p>
                        <progress className="progress progress-primary w-full" value={progress.value.toString()} max={progress.max.toString()}></progress>
                        <button onClick={() => setStage(0)}>XD</button>
                        <div className="bg-base-200 p-2 grid gap-2">
                            <div className="flex gap-2 items-center">
                                <Terminal size={20} />
                                <h1 className="font-bold text-sm">Terminal logs</h1>
                            </div>
                            <div className="bg-base-100 text-xs p-2 overflow-scroll overflow-y-auto overflow-x-hidden h-52">
                                {sortLog && sortLog.map(line =>
                                    <p key={line}>
                                        <span className="text-zinc-500">{line.split(",")[0]}{" "}</span>
                                        {line.split(",")[1] == "INFO" ? <span className="text-info">[i]</span> :
                                            line.split(",")[1] == "SUCCESS" ? <span className="text-success">[✓]</span> :
                                                <span className="text-error">[✗]</span>}
                                        {" "}
                                        {line.split(",")[2]}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary btn-wide">Finish</button>
                        </form>
                    </div>
                </div>}
        </dialog>
    );
};

export default Modal;