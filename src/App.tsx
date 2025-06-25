import { invoke } from "@tauri-apps/api/core";
import { ArrowRight, FileText, FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import FileSquare from "./components/fileSquare";
import ExtensionSquare from "./components/extensionSquare";
import Summary from "./components/summary";

type file = {
  filename: string;
};

type extension = {
  extension: string;
};

type group = {
  groupName: string,
  content: file | extension | null;
};

export default function App() {
  // Import the invoke function from Tauri
  const [directory, setDirectory] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [startFiles, setStartFiles] = useState<string[]>([]);
  const [extensions, setExtensions] = useState<Array<extensionStruct>>();
  const [groups, setGroups] = useState<group[]>([]);
  const [groupInputText, setGroupInputText] = useState("");
  const [invidualFilesSearchFieldVisibility, setInvidualFilesSearchFieldVisibility] = useState(false);
  const [invidualFilesSearchText, setInvidualFilesSearchText] = useState("");


  interface SearchEvent extends React.ChangeEvent<HTMLInputElement> { }

  function searchInvidualFile(e: SearchEvent): void {
    setInvidualFilesSearchText(e.target.value);
    const filteredFiles = startFiles.filter((file: string) => file.startsWith(e.target.value));
    if (filteredFiles.length > 0) {
      setFiles(startFiles.filter((file: string) => file.startsWith(e.target.value)));
    }
  }

  function addNewGroup() {
    const newGroupName = groupInputText;
    let isValid = true;
    if (newGroupName.length > 15 || newGroupName.length == 0) return;
    groups.forEach(singleGroup => {
      if (singleGroup.groupName == newGroupName) isValid = false;
    });
    if (!isValid) return;

    const new_group: group = {
      groupName: groupInputText,
      content: null
    };
    setGroupInputText("");
    setGroups(prevGroups => [...prevGroups, new_group]);
  }

  function deleteGroup(index: number) {
    setGroups(groups.filter(group => groups.indexOf(group) != index));
  }

  // Function to call the Rust "ls" command
  async function callLs(directory: string) {
    try {
      const result = await invoke<string[]>('ls', { dir: directory });
      setFiles(result);
      setStartFiles(result);
      unpackExtensions(result);
      console.log('ls result:', result);
    } catch (error) {
      console.error('Error calling ls:', error);
    }
  }

  type extensionStruct = {
    extension: string,
    count: number;
  };
  function unpackExtensions(files: Array<String>) {
    let extensions: Array<extensionStruct> = [];
    files.forEach((file) => {
      const pieces = file.split(".");
      const extension = pieces[pieces.length - 1];
      if (!extensions.some(ext => ext.extension === extension)) {
        extensions.push({ extension, count: 1 });
      } else {
        const extObj = extensions.find(ext => ext.extension === extension);
        if (extObj) extObj.count += 1;
      }
    });
    setExtensions(extensions);
  }

  async function getDirectory() {
    setGroups([]);
    const directory = await open({
      multiple: false,
      directory: true
    });
    if (!directory) return;
    setDirectory(directory ?? "brak");
    callLs(directory);


  }
  if (files.length == 0) {
    return <div className="w-full h-screen flex items-center justify-center">
      <button className="btn btn-primary" onClick={getDirectory}>
        <FolderOpen size={20} />
        Change Folder</button>
    </div>;
  }
  return (
    <div className="bg-base-300">
      {/* Navbar */}
      <div className="navbar bg-base-200 shadow-sm border-b-2 border-base-100-50 fixed z-50">
        <div className="navbar-start pl-5 gap-5">
          <h1 className="text-2xl font-semibold hidden md:block">File sorter</h1>
          <div className="divider hidden md:visible">|</div>
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <FolderOpen size={16} className="text-accent" />
            {directory}
          </div>
        </div>
        <div className="navbar-center">

        </div>
        <div className="navbar-end">
          <button className="btn btn-primary" onClick={getDirectory}>
            <FolderOpen size={20} />
            Change Folder</button>
        </div>
      </div>
      <div className="h-16"></div>
      {/* main */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-7 gap-5 text-center justify-center">
        {/* Invidual Files */}
        <div className="col-span-1 md:col-span-2 bg-base-200 rounded-xl border-2 border-base-100-50 p-5 flex flex-col gap-2 h-96">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-darker p-2 text-left">Individual Files</p>
            <button
              onClick={() => setInvidualFilesSearchFieldVisibility(!invidualFilesSearchFieldVisibility)}
              className="btn btn-ghost btn-xs btn-primary">
              <Search className="text-darker" size={16} />
            </button>
          </div>
          {invidualFilesSearchFieldVisibility &&
            <label
              className="input focus-within:border-1 focus-within:border-primary focus-within:ring-0 focus-within:outline-none"
            >
              <Search size={16} className="text-darker" />
              <input value={invidualFilesSearchText} onChange={searchInvidualFile} type="search" className="grow p-2" placeholder="Search" />
            </label>


          }

          <div className="grid grid-cols-1 gap-2 overflow-y-scroll overflow-x-hidden">
            {files && files.map((file) => (
              <FileSquare fileIcon={FileText} fileName={file} key={file} fileSize={5234} />
            ))}
          </div>
        </div>
        {/* File Extensions */}
        <div className="col-span-1 md:col-span-5 bg-base-200 rounded-xl border-2 border-base-100-50 p-10 text-left flex flex-col gap-2 h-96">
          <h1 className="text-2xl font-semibold">File extensions</h1>
          <p className="text-darker">Drag extensions to groups to sort files automatically</p>
          <div className="grid-flow-row-dense grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5 w-full overflow-scroll overflow-x-hidden">
            {extensions && extensions.map((extension) =>
              <ExtensionSquare extensionName={extension.extension} extensionCount={extension.count} />
            )}
          </div>
        </div>
        {/* Summary */}
        <div className="col-span-1 md:col-span-2">
          <Summary filesLength={files.length} extensionsLength={extensions!.length} groupsLength={groups.length} />
        </div>
        {/* Groups */}
        <div className="col-span-1 md:col-span-5">
          <div className="flex justify-between">
            <h1 className="text-xl font-semibold">Groups</h1>
            <div className="flex gap-2">
              <input className="input" placeholder="Group name" value={groupInputText} onChange={(e) => setGroupInputText(e.target.value)}></input>
              <button className="btn btn-primary" onClick={addNewGroup}>+</button>

            </div>
          </div>
          <div className="pt-5 grid grid-cols-2 gap-5">
            {groups.length > 0 ? groups.map((group, index) =>
              <div className="border-2 border-base-100-50 border-dotted p-5">
                <div className="flex justify-between items-center">
                  <p className="text-left">{group.groupName}</p>
                  <button onClick={() => deleteGroup(index)} className="btn btn-ghost btn-error">
                    <Trash2 size={16} className="text-darker" />
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="border-2 border-base-100-50 rounded-full p-1 flex items-center justify-center">
                    <Plus className="text-success" />
                  </div>
                  <span className="text-center text-sm text-darker">Drop files here</span>
                </div>
              </div>)
              : <p>no</p>}
          </div>
        </div>
        {/* Actions */}
        <div className="p-2 col-span-1 md:col-span-7 flex justify-end gap-5">
          <button className="btn btn-outline">Reset groups</button>
          <button className="btn btn-primary">Sort <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};