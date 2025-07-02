import { invoke } from "@tauri-apps/api/core";
import { ArrowRight, Folder, FolderOpen, GripVertical, Search } from "lucide-react";
import { useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import FileSquare from "./components/fileSquare";
import ExtensionSquare from "./components/extensionSquare";
import Summary from "./components/summary";
import GroupSquare from "./components/groupSquare";
import { DndContext, DragEndEvent, DragOverlay, useDroppable } from "@dnd-kit/core";
import { Group } from "./models/groupModel";
import { Groups } from "./models/groupsModel";
import { Extensions } from "./models/extensionsModel";
import { Extension } from "./models/extensionModel";
import { Files } from "./models/filesModel";
import { File } from "./models/fileModel";
import Modal from "./components/modal";
import { motion } from "motion/react";
import { formatBytes } from "./functions/formatBytes";
import { getIconByExtension } from "./functions/getIcon";

export default function App() {
  const groupList = useRef(new Groups);
  const extensionList = useRef(new Extensions);
  const fileList = useRef(new Files);
  const initialFileList = useRef(new Files);
  const initialExtensionList = useRef(new Extensions);
  const extensionsRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);

  const [directory, setDirectory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupInputText, setGroupInputText] = useState("");
  const [invidualFilesSearchFieldVisibility, setInvidualFilesSearchFieldVisibility] = useState(false);
  const [invidualFilesSearchText, setInvidualFilesSearchText] = useState("");
  const [invidualExtensionSearchFieldVisibility, setExtensionFilesSearchFieldVisibility] = useState(false);
  const [invidualExtensionText, setInvidualExtensionSearchText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({
    id: "0"
  });

  interface SearchEvent extends React.ChangeEvent<HTMLInputElement> { }

  // Funkcja pomocznicza, która porównuje zbiór initial i zwykłych plików i
  // Na tej podstawie wyznacza ich róznice i tą róznicę zapisuje w files
  function getUnsortedFiles(): File[] {
    const allFiles = initialFileList.current.getFileList(); // Wszystkie pliki
    const sortedFiles = groupList.current.getGroupList().flatMap(group =>
      group.files ? group.files.getFileList() : []
    );

    const sortedFileNames = new Set(sortedFiles.map(f => f.name));
    return allFiles.filter(f => !sortedFileNames.has(f.name));
  }

  function searchInvidualFile(e: SearchEvent): void {
    const query = e.target.value.toLowerCase();
    setInvidualFilesSearchText(query);

    const filtered = getUnsortedFiles().filter(file =>
      file.name.toLowerCase().includes(query)
    );
    setFiles(filtered);
  }

  function getUnsortedExtensions(): Extension[] {
    const allExtensions = initialExtensionList.current.getExtensionList(); // Wszystkie rozszerzenia
    const sortedExtensions = groupList.current.getGroupList().flatMap(group =>
      group.extensions ? group.extensions.getExtensionList() : []
    );

    const sortedExtensionNames = new Set(sortedExtensions.map(ext => ext.name));
    return allExtensions.filter(ext => !sortedExtensionNames.has(ext.name));
  }

  function searchInvidualExtension(e: SearchEvent): void {
    const query = e.target.value.toLowerCase();
    setInvidualExtensionSearchText(query);

    const filtered = getUnsortedExtensions().filter(extension =>
      extension.name.toLowerCase().includes(query)
    );
    setExtensions(filtered);
  }

  function addNewGroup() {
    const newGroupName = groupInputText;

    // Sprawdź czy nazwa grupy nie jest za długa
    if (newGroupName.length > 15 || newGroupName.length == 0) return;

    // Sprawdź czy nie ma grupy o takiej samej nazwie
    if (groupList.current.groupExistsByName(newGroupName)) return;

    // Stwórz nową grupę i dodaj ją do listy grup
    const newGroup = new Group(
      groupList.current.getLastID() + 1,
      newGroupName,
      null,
      null
    );
    groupList.current.addGroup(newGroup);
    setGroups(groupList.current.getGroupList());

    // Wyczyść input
    setGroupInputText("");
  }

  function deleteGroup(id: number) {
    // Usuń grupe o danym ID i zaktualizuj grupy
    groupList.current.deleteGroupByID(id);
    setGroups(groupList.current.getGroupList());
  }

  // Function to call the Rust "ls" command
  async function callLs(directory: string) {
    try {
      const filesResult: string[] = await invoke<string[]>('ls', { dir: directory });

      filesResult.forEach(file => {
        const fileName = file[0];
        const fileSize: number = file[1] as unknown as number;

        const lastID = fileList.current.getLastID();
        const newFile = new File(lastID + 1, fileName, fileSize);
        fileList.current.addFile(newFile);
      });

      fileList.current.sort();
      initialFileList.current = fileList.current;

      setFiles(fileList.current.getFileList());
      unpackExtensions(filesResult);
    } catch (error) {
      console.error('Error calling ls:', error);
    }
  }

  function unpackExtensions(files: Array<String>) {
    files.forEach((file) => {
      const pieces = file[0].toLowerCase().split(".");
      const extensionName = pieces[pieces.length - 1];
      const lastID = extensionList.current.getLastID();

      const newExtension = new Extension(lastID + 1, extensionName, 1);

      // Jezeli nie istnieje jeszcze takie extension, to dodaj je do listy, jak tak - zwieksz liczebność jego pliku
      if (!extensionList.current.extensionExistsByName(extensionName)) {
        extensionList.current.addExtension(newExtension);
      } else {
        const existingExtension = extensionList.current.getExtensionByName(extensionName);
        if (existingExtension) existingExtension.count += 1;
      }
    });
    // Zaktualizuj liste extension
    extensionList.current.sort();
    initialExtensionList.current = extensionList.current;
    setExtensions(extensionList.current.getExtensionList());
  }

  async function getDirectory() {
    // Wyczyść wszystko
    setGroups([]);
    groupList.current.clear();
    fileList.current.clear();
    extensionList.current.clear();
    initialExtensionList.current.clear();
    initialFileList.current.clear();
    setInvidualExtensionSearchText("");
    setInvidualFilesSearchText("");
    setInvidualFilesSearchFieldVisibility(false);
    setExtensionFilesSearchFieldVisibility(false);


    // Wybierz directory
    const directory = await open({
      multiple: false,
      directory: true
    });
    if (!directory) return;

    setDirectory(directory ?? "Directory not selected");
    callLs(directory);
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;

    if (!over || !active) return;
    const groupID = over.id as number;
    const itemName = active.id as string;
    const prefix = itemName.split("-")[0];
    if (prefix == "extension") {
      // extension
      const currentGroup = groupList.current.getGroupByID(groupID);
      if (!currentGroup) return;

      const extensionID = Number(itemName.replace(`${prefix}-`, ""));
      const extensionToAdd = extensionList.current.getExtensionByID(extensionID);

      // Jezeli grupa nie ma zadnych extension to zrób nową listę extension
      if (!currentGroup.extensions) {
        currentGroup.extensions = new Extensions();
      }
      if (extensionToAdd && !currentGroup.extensions.extensionExistsByName(extensionToAdd.name)) {
        currentGroup.extensions.addExtension(extensionToAdd);
      }
      // Usuń to ID z głównej listy extensions
      extensionList.current.removeExtensionByID(extensionID);
      const allUnsorted = extensionList.current.getExtensionList();

      const filtered = allUnsorted.filter((extension) =>
        extension.name.toLowerCase().includes(invidualExtensionText.toLowerCase())
      );

      setExtensions(filtered);
      setGroups(groupList.current.getGroupList());
    }
    else if (prefix == "file") {
      // file
      const currentGroup = groupList.current.getGroupByID(groupID);
      if (!currentGroup) return;

      // Znajdź sobie ID pliku
      const fileID = Number(itemName.replace(`${prefix}-`, ""));
      const fileToAdd = fileList.current.getFileByID(fileID);

      if (!currentGroup.files) {
        currentGroup.files = new Files();
      }
      if (fileToAdd && !currentGroup.files.FileExistsByName(fileToAdd.name)) {
        currentGroup.files.addFile(fileToAdd);
      }
      console.log(fileToAdd);
      console.log(currentGroup);
      // Usuń to ID z głównej listy plików
      fileList.current.removeFileByID(fileID);
      const allUnsorted = fileList.current.getFileList();

      const filtered = allUnsorted.filter((file) =>
        file.name.toLowerCase().includes(invidualFilesSearchText.toLowerCase())
      );

      setFiles(filtered);
      setGroups(groupList.current.getGroupList());
    }
    else {
      throw ("error");
    }
  }
  return (
    <div className="bg-base-300 select-none flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-base-200 shadow-sm border-b-2 border-base-100-50 fixed z-50">
        <div className="navbar-start pl-5 gap-5 items-center">
          <div className="flex gap-2 items-center">
            <FolderOpen className="bg-primary p-1 rounded-md" />
            <h1 className="text-xl font-semibold hidden md:block">Sortra</h1>
          </div>
          {directory != "" ?
            <div className="flex items-center gap-2 text-sm invisible sm:visible">
              <FolderOpen size={16} className="text-accent" />
              {/* Directory */}
              <p className="text-darker">{directory}</p>
            </div>
            : null}
        </div>
        <div className="navbar-center">
        </div>
        <div className="navbar-end">
          <motion.button className="btn btn-primary"
            onClick={getDirectory}
            animate={directory == "" ? { scale: [1, 1.1] } : { scale: 1 }}
            transition={
              directory == ""
                ? {
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }
                : { duration: 0.2 }
            }
            whileHover={{
              scale: 1.1,
              y: -2,
              boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
              rotate: 3
            }}
            whileTap={{
              scale: 0.95,
              rotate: 0
            }}>
            <FolderOpen size={20} />
            Change Folder
          </motion.button>
        </div>
      </div>
      <div className="h-16"></div>
      {/* main */}
      <DndContext
        onDragStart={(e) => {
          // setIsDragging(true);
          if (extensionsRef.current && filesRef.current) {
            extensionsRef.current!.className = "grid grid-cols-[repeat(auto-fit,_minmax(100px,_1fr))] gap-5 w-full overflow-hidden";
            filesRef.current!.className = "grid grid-cols-1 gap-2 overflow-y-scroll overflow-x-hidden";
          }
          setActiveId(e.active.id as string);
        }}
        onDragEnd={(e) => {
          if (extensionsRef.current && filesRef.current) {
            extensionsRef.current!.className = "grid grid-cols-[repeat(auto-fit,_minmax(100px,_1fr))] gap-5 w-full overflow-y-scroll";
            filesRef.current!.className = "grid grid-cols-1 gap-2 overflow-y-scroll overflow-y-scroll";
          }
          // setIsDragging(false);
          setActiveId(null);
          handleDragEnd(e);
        }}
      >
        <div className="sm:h-[calc(100vh-64px)] p-5 grid grid-cols-1 grid-rows-auto sm:grid-cols-[minmax(200px,_350px),_1fr] sm:grid-rows-[4fr_2fr_min-content] gap-5 text-center justify-center">
          {/* Invidual Files */}
          <motion.div className="col-span-1 bg-base-200 rounded-xl border-2 border-base-100-50 p-5 flex flex-col gap-2 shadow-sm min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-darker p-2 text-left visible">Individual Files</p>
              <button
                onClick={() => setInvidualFilesSearchFieldVisibility(!invidualFilesSearchFieldVisibility)}
                className="btn btn-ghost btn-xs btn-primary">
                <Search className="text-darker" size={16} />
              </button>
            </div>
            {invidualFilesSearchFieldVisibility ?
              <motion.label
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className="input focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
              >
                <Search size={16} className="text-darker" />
                <input value={invidualFilesSearchText} onChange={searchInvidualFile} type="search" className="grow p-2" placeholder="Search" />
              </motion.label>
              :
              <p className="text-xs text-left text-darker">Drag files to override extensions rules</p>
            }
            {/* Files Ref*/}
            <div ref={filesRef} className={`grid gap-2 overflow-y-scroll overflow-x-hidden`}>
              {files && files.map((file, idx) => (
                <FileSquare order={idx} id={file.id} fileName={file.name} key={file.id} fileSize={file.size} isDragging={activeId === `file-${file.id}`} />
              ))}
            </div>
          </motion.div>
          {/* Extensions */}
          <div className="col-span-1 bg-base-200 rounded-xl border-2 border-base-100-50 p-5 text-left flex flex-col gap-2 shadow-sm min-h-0">
            <div className="flex justify-between">
              <h1 className="text-2xl font-semibold">File extensions</h1>
              <button
                onClick={() => setExtensionFilesSearchFieldVisibility(!invidualExtensionSearchFieldVisibility)}
                className="btn btn-ghost btn-xs btn-primary">
                <Search className="text-darker" size={16} />
              </button>
            </div>
            {invidualExtensionSearchFieldVisibility ?
              <motion.label
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className="input w-full focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
              >
                <Search size={16} className="text-darker" />
                <input value={invidualExtensionText} onChange={searchInvidualExtension} type="search" className="grow p-2" placeholder="Search" />
              </motion.label>
              :
              <p className="text-darker">Drag extensions to groups to sort files automatically</p>
            }
            <div className={`grid grid-cols-[repeat(auto-fit,_minmax(100px,_1fr))] overflow-x-hidden gap-5 ${isDragging ? "overflow-hidden" : "overflow-y-auto"}`}>
              {extensions && extensions.map((extension) =>
                <ExtensionSquare key={extension.id} id={extension.id} extensionName={extension.name} extensionCount={extension.count} isDragging={activeId === `extension-${extension.id}`} />
              )}
            </div>
          </div>
          {/* Summary */}
          <div className="col-span-1 shadow-sm">
            <Summary filesLength={initialFileList.current.getFilesCount()} extensionsLength={extensions!.length} groupsLength={groups.length} />
          </div>
          {/* Groups */}
          <div className="col-span-1 max-h-[45vh]">
            <div className="flex justify-between">
              <h1 className="text-xl font-semibold invisible sm:visible">Groups</h1>
              <div className="flex gap-2">
                {/* {Group Input} */}
                <input
                  className="input focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
                  placeholder="Group name"
                  pattern={
                    groupInputText !== ""
                      ? "^(?!^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$)[^\\\\/:*?\"<>|.\\s][^\\\\/:*?\"<>|]{0,254}[^\\\\/:*?\"<>|.\\s]$"
                      : undefined
                  }
                  value={groupInputText}
                  onChange={(e) => setGroupInputText(e.target.value)}
                />
                <motion.button
                  disabled={directory == "" ? true : false}
                  className="btn btn-primary"
                  onClick={addNewGroup}
                  animate={directory != "" && groupList.current.getGroupsCount() == 0 ? { scale: [1, 1.1] } : { scale: 1 }}
                  transition={
                    directory != "" && groupList.current.getGroupsCount() == 0
                      ? {
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }
                      : { duration: 0.2 }

                  }
                  whileHover={{
                    scale: 1.1,
                    y: -2,
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
                    rotate: 3
                  }}
                  whileTap={{
                    scale: 0.95,
                    rotate: 0
                  }}
                >
                  +
                </motion.button>
              </div>
            </div>
            <div ref={setNodeRef} className="pt-5 grid grid-cols-2 gap-5 h-[calc(100%-64px)]">
              {groups.length > 0 ? groups.map(group =>
                <GroupSquare
                  key={group.id}
                  id={group.id}
                  groupName={group.name}
                  onDelete={() => deleteGroup(group.id)}
                  onExtensionRemove={() => setGroups([...groupList.current.getGroupList()])}
                  extensions={group.extensions ?? new Extensions()}
                  files={group.files ?? new Files()} />)
                :
                // No groups
                <div className="col-span-2 border-2 border-base-100-50 border-dotted p-5">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="border-2 border-base-100-50 rounded-full p-2 flex items-center justify-center">
                      <Folder className="text-success" />
                    </div>
                    <span className="text-center text-sm font-semibold">No groups yet</span>
                    <span className="text-darker text-xs w-1/2">Create your first group to start organizing your files. Drag file extensions to groups to sort them automatically.</span>
                  </div>
                </div>}
            </div>
          </div>
          {/* Actions */}
          <div className="p-2 col-span-1 col-start-2 flex justify-end gap-5">
            <button className="btn btn-outline" onClick={() => {
              setGroups([]);
              groupList.current.clearItems();
            }}>Reset groups</button>
            <button className="btn btn-primary" disabled={groupList.current.empty()} onClick={() => {
              const modal = document.getElementById('my_modal_1') as HTMLDialogElement | null;
              if (modal) {
                modal.showModal();
              }
            }}>Sort <ArrowRight size={16} /></button>
          </div>
        </div>
        <DragOverlay dropAnimation={{
          duration: 500,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {/* Ghost Extension */}
          {activeId && activeId.split("-")[0] == "extension" ? (
            <div className="p-5 bg-base-100 rounded-xl flex flex-col items-center justify-center gap-2 opacity-80 shadow-lg pointer-events-none">
              <GripVertical size={12} className="text-darker" />
              {(() => {
                const extension = extensionList.current.getExtensionByID(Number(activeId.replace("extension-", "")));
                const fileExtension = "." + extension?.name.split(".")[extension?.name.split(".").length - 1];
                const IconComponent = getIconByExtension(fileExtension);
                return <IconComponent className="text-accent" size={12} />;
              })()}
              <p className="text-sm">
                {(() => {
                  const extension = extensionList.current.getExtensionByID(Number(activeId.replace("extension-", "")));
                  return `.${extension?.name}`;
                })()}
              </p>
              <p className="text-xs text-darker">{(() => {
                const extension = extensionList.current.getExtensionByID(Number(activeId.replace("extension-", "")));
                return `${extension?.count} files`;
              })()}</p>
            </div>
            // Ghost File
          ) : activeId && activeId.split("-")[0] == "file" ? (
            <div className="text-left bg-base-100 hover:brightness-200 hover:cursor-move p-2 grid grid-cols-10 items-center gap-5">
              <GripVertical size={16} className="text-darker col-span-1" />
              {(() => {
                const file = fileList.current.getFileByID(Number(activeId.replace("file-", "")));
                const fileExtension = "." + file?.name.split(".")[file?.name.split(".").length - 1];
                const IconComponent = getIconByExtension(fileExtension);
                return <IconComponent className="text-accent col-span-2" />;
              })()}
              <div className="flex flex-col col-span-7">
                <p className="line-clamp-2 break-all text-sm max-w-[180px]">
                  {`${fileList.current.getFileByID(Number(activeId.replace("file-", "")))?.name}`}
                </p>
                <p className="text-darker text-xs">
                  {(() => {
                    const file = fileList.current.getFileByID(Number(activeId.replace("file-", "")));
                    if (file)
                      return formatBytes(file.size);
                  })()}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <Modal groupList={groupList.current} files={initialFileList.current} directory={directory} />
    </div>
  );
};
