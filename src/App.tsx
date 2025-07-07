import { invoke } from "@tauri-apps/api/core";
import { Folder, GripVertical, Plus, Search } from "lucide-react";
import { useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import FileSquare from "./components/fileSquare";
import ExtensionSquare from "./components/extensionSquare";
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
import TopBar from "./main/topbar";
import BottomBar from "./main/bottombar";

export default function App() {
  const groupList = useRef(new Groups);
  const extensionList = useRef(new Extensions);
  const fileList = useRef(new Files);
  const initialFileList = useRef(new Files);
  const initialExtensionList = useRef(new Extensions);

  const [directory, setDirectory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invidualFilesSearchFieldVisibility, setInvidualFilesSearchFieldVisibility] = useState(false);
  const [invidualFilesSearchText, setInvidualFilesSearchText] = useState("");
  const [invidualExtensionSearchFieldVisibility, setExtensionFilesSearchFieldVisibility] = useState(false);
  const [invidualExtensionText, setInvidualExtensionSearchText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // fae - Files and Extensions
  const [filesShown, setfilesShown] = useState(false);

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
    const newGroupName = "Group " + String(groupList.current.getLastID() + 1);

    // Stwórz nową grupę i dodaj ją do listy grup
    const newGroup = new Group(
      groupList.current.getLastID() + 1,
      newGroupName,
      null,
      null
    );
    groupList.current.addGroup(newGroup);
    // Force a new array reference to trigger re-render
    setGroups([...groupList.current.getGroupList()]);
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

  function onGroupNameChange(e: React.FocusEvent<HTMLInputElement>, previousName: string, id: number) {
    const newGroupName = e.target.value;
    if (newGroupName.length > 15 || newGroupName.length == 0) {
      e.target.value = previousName;
      return;
    }

    if (groupList.current.groupExistsByName(newGroupName)) {
      e.target.value = previousName;
      return;
    }
    console.log("zmiana");
    if (groupList.current.getGroupByID(id)) {
      groupList.current.getGroupByID(id)!.name = newGroupName;
      setGroups([...groupList.current.getGroupList()]);
    }
  }
  return (
    <div className="bg-base-300 select-none flex flex-col overflow-x-hidden">

      <TopBar directory={directory} getDirectory={getDirectory} />
      {/* Rekompensata za topbar */}
      <div className="h-16"></div>

      {/* main */}
      <DndContext
        onDragStart={(e) => {
          setActiveId(e.active.id as string);
        }}
        onDragEnd={(e) => {
          setActiveId(null);
          handleDragEnd(e);
        }}
      >
        <div className="h-[calc(100vh-145px)] p-4 grid grid-cols-1 sm:grid-cols-[minmax(250px,350px),_1fr] gap-4 overflow-hidden">
          {/* Switch : Files - True, Extensions - False*/}
          <div className="bg-base-200 rounded-xl border-2 border-base-100-50 p-4 text-left flex flex-col gap-2 shadow-sm max-sm:min-h-[225px] min-h-[205px]">
            <div className="flex justify-between items-center">
              <div className="p-1 bg-base-100-50 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                <input
                  className={`btn ${!filesShown ? "btn-active btn-primary rounded-lg" : "bg-transparent border-0 shadow-none text-darker"}`}
                  type="radio"
                  name="options"
                  aria-label="Extensions"
                  checked={!filesShown}
                  onChange={() => {
                    setfilesShown(false);
                    setExtensionFilesSearchFieldVisibility(false);
                    setInvidualFilesSearchFieldVisibility(false);
                  }}
                />
                <input
                  className={`btn ${filesShown ? "btn-active btn-primary rounded-lg" : "bg-transparent border-0 shadow-none text-darker"}`}
                  type="radio"
                  name="options"
                  aria-label="Files"
                  checked={filesShown}
                  onChange={() => {
                    setfilesShown(true);
                    setExtensionFilesSearchFieldVisibility(false);
                    setInvidualFilesSearchFieldVisibility(false);
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (filesShown) {
                    setInvidualFilesSearchFieldVisibility(!invidualFilesSearchFieldVisibility);

                  }
                  else {
                    setExtensionFilesSearchFieldVisibility(!invidualExtensionSearchFieldVisibility);
                  }
                }
                }
                className="btn btn-ghost btn-xs btn-primary">
                <Search className="text-darker" size={16} />
              </button>
            </div>
            {invidualExtensionSearchFieldVisibility && !filesShown ?
              <motion.label
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className="input input-sm w-full focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
              >
                <Search size={16} className="text-darker" />
                <input value={invidualExtensionText} onChange={searchInvidualExtension} type="search" className="grow p-2" placeholder="Search" />
              </motion.label>
              :
              !filesShown && <p className="text-xs text-left text-darker">Drag files to sort them by extensions</p>
            }
            {invidualFilesSearchFieldVisibility && filesShown ?
              <motion.label
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className="input input-sm w-full focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
              >
                <Search size={16} className="text-darker" />
                <input value={invidualFilesSearchText} onChange={searchInvidualFile} type="search" className="grow p-2" placeholder="Search" />
              </motion.label>
              :
              filesShown && <p className="text-xs text-left text-darker">Drag files to override extensions rules</p>
            }
            {/* Render both, but hide with CSS to keep them mounted */}
            <div className="relative w-full h-full">
              {/* Extensions */}
              <div
                style={{ display: !filesShown ? "block" : "none" }}
                className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${!filesShown ? "z-10" : "z-0"}`}
              >
                <div className={` grid grid-cols-[repeat(auto-fit,_minmax(90px,_1fr))] gap-3 scroll-p-2`}>
                  {extensions && extensions.map((extension) =>
                    <ExtensionSquare key={extension.id} id={extension.id} extensionName={extension.name} extensionCount={extension.count} isDragging={activeId === `extension-${extension.id}`} />
                  )}
                </div>
              </div>
              {/* Files */}
              <div
                style={{ display: filesShown ? "block" : "none" }}
                className={`overflow-y-auto overflow-x-hidden absolute inset-0 ${filesShown ? "z-10" : "z-0"}`}
              >
                <div className={`flex flex-col gap-2 overflow-hidden`}>
                  {files && files.map((file, idx) => (
                    <FileSquare order={idx} id={file.id} fileName={file.name} key={file.id} fileSize={file.size} isDragging={activeId === `file-${file.id}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Groups */}
          <div className="min-h-0 flex flex-col gap-4 min-w-[350px]">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold hidden sm:block">Groups</h1>
              <motion.button
                disabled={directory == "" ? true : false}
                className="btn btn-primary w-full sm:w-auto"
                onClick={addNewGroup}
                animate={directory != "" && groupList.current.getGroupsCount() == 0 ? { scale: [1, 1.1] } : { scale: 1 }}
                transition={
                  directory != "" && groupList.current.getGroupsCount() == 0
                    ? {
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }
                    : { duration: 0.2 }

                }
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
                }}
                whileTap={{
                  scale: 0.95,
                }}
              >
                <Plus size={16} />
                Add group
              </motion.button>
            </div>
            <div ref={setNodeRef} className={`grid overflow-y-auto grid-cols-[repeat(auto-fit,_minmax(290px,_1fr))] gap-3 min-h-0 h-full`}>
              {groups.length > 0 ? groups.map(group =>
                <GroupSquare
                  key={group.id}
                  id={group.id}
                  groupName={group.name}
                  onDelete={() => deleteGroup(group.id)}
                  onExtensionRemove={() => setGroups([...groupList.current.getGroupList()])}
                  onFileRemove={() => setGroups([...groupList.current.getGroupList()])}
                  extensions={group.extensions ?? new Extensions()}
                  files={group.files ?? new Files()}
                  onGroupNameChange={onGroupNameChange}
                />)

                :
                // No groups
                <div className="col-span-2 border-2 border-base-100-50 border-dotted p-4">
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <div className="border-2 border-base-100-50 rounded-full p-2 flex items-center justify-center">
                      <Folder className="text-success" />
                    </div>
                    <span className="text-sm font-semibold">No groups yet</span>
                    <span className="text-center text-darker text-xs w-3/4">Create your first group to start organizing your files.<br />Drag file extensions to groups to sort them automatically.</span>
                  </div>
                </div>}
            </div>
          </div>
          {/* Close grid container */}
        </div>
        {/* BottomBar */}
        <BottomBar
          resetFunction={function (): void {
            groupList.current.clear();
            setGroups([]);
          }}
          sortFunction={function (): void {
            const modal = document.getElementById('my_modal_1') as HTMLDialogElement | null;
            if (modal) {
              modal.showModal();
            };
          }}
          sortDisabled={groupList.current.empty()}
          files={initialFileList.current.getFilesCount()}
          extensions={extensions!.length}
          groups={groups.length}
          totalSize={getUnsortedFiles().reduce((acc, file) => acc + file.size, 0)}
          mostCommonExtension={extensionList.current.getExtensionWithMostCount()?.name ?? "ext"}
          mostCommonNumber={extensionList.current.getExtensionWithMostCount()?.count ?? 0} />
        <DragOverlay dropAnimation={{
          duration: 500,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {/* Ghost Extension */}
          {activeId && activeId.split("-")[0] == "extension" ? (
            <div className="h-[90px] p-3 bg-base-100 rounded-xl grid grid-cols-[min-content_1fr] items-center gap-1 opacity-80 shadow-lg pointer-events-none">
              <GripVertical size={16} className="text-darker" />
              <div className="flex flex-col items-center gap-1">
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
            </div>
            // Ghost File
          ) : activeId && activeId.split("-")[0] == "file" ? (
            <div className="shadow-lg text-left bg-base-100 rounded-md hover:brightness-200 hover:cursor-move p-2 grid grid-cols-[min-content_min-content_1fr] items-center gap-1">
              <GripVertical size={16} className="text-darker" />
              {(() => {
                const file = fileList.current.getFileByID(Number(activeId.replace("file-", "")));
                const fileExtension = "." + file?.name.split(".")[file?.name.split(".").length - 1];
                const IconComponent = getIconByExtension(fileExtension);
                return <IconComponent className="text-accent" />;
              })()}
              <div className="flex flex-col">
                <p className="line-clamp-2 break-all text-sm">
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
