import { File } from "./fileModel";

export class Files {
    private FileList: Array<File> = [];

    public getLastID(): number {
        if (this.FileList.length == 0) return 0;

        const lastID = this.FileList[this.FileList.length - 1].id;
        return lastID;
    }

    public getFileByID(id: number): File | null {
        if (this.FileList.length == 0) return null;

        const file = this.FileList.find(f => f.id === id);
        return file ?? null;
    }

    public getFileList(): Array<File> {
        return this.FileList;
    }

    public getFilesCount(): number {
        return this.FileList.length;
    }

    public FileExistsByName(FileName: string) {
        const result = this.FileList.findIndex(f => f.name === FileName);
        return result == -1 ? false : true;
    }

    public getFileByName(FileName: string) {
        const result = this.FileList.find(f => f.name === FileName);
        return result;
    }

    public addFile(newFile: File) {
        this.FileList.push(newFile);
    }

    public map<T>(callback: (file: File, index: number, array: File[]) => T): T[] {
        return this.FileList.map(callback);
    }

    public removeFileByID(id: number): void {
        this.FileList = this.FileList.filter(f => f.id !== id);
    }
    public clear() {
        this.FileList = [];
    }
    public sort() {
        this.FileList.sort((a, b) => a.name.localeCompare(b.name));
    }
    public getFilesByExtension(extension: string) {
        const filesWithThatExtension = this.FileList.filter(file => {
            const slices = file.name.split(".");
            return slices[slices.length - 1] == extension;
        });
        return filesWithThatExtension;
    }
}