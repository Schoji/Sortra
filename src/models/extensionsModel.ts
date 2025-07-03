import { Extension } from "./extensionModel";

export class Extensions {
    private ExtensionList: Array<Extension> = [];

    public getLastID(): number {
        if (this.ExtensionList.length == 0) return 0;

        const lastID = this.ExtensionList[this.ExtensionList.length - 1].id;
        return lastID;
    }

    public getExtensionByID(id: number): Extension | null {
        if (this.ExtensionList.length == 0) return null;

        const Extension = this.ExtensionList.find(f => f.id === id);
        return Extension ?? null;
    }

    public getExtensionList(): Array<Extension> {
        return this.ExtensionList;
    }

    public getExtensionsCount(): number {
        return this.ExtensionList.length;
    }
    public extensionExistsByName(ExtensionName: string) {
        const result = this.ExtensionList.findIndex(f => f.name === ExtensionName);
        return result == -1 ? false : true;
    }

    public getExtensionByName(ExtensionName: string) {
        const result = this.ExtensionList.find(f => f.name === ExtensionName);
        return result;
    }

    public addExtension(newExtension: Extension) {
        this.ExtensionList.push(newExtension);
    }

    public map<T>(callback: (extension: Extension, index: number, array: Extension[]) => T): T[] {
        return this.ExtensionList.map(callback);
    }

    public removeExtensionByID(id: number): void {
        this.ExtensionList = this.ExtensionList.filter(f => f.id !== id);
    }

    public clear() {
        this.ExtensionList = [];
    }
    public sort() {
        this.ExtensionList.sort((a, b) => a.count - b.count).reverse();
    }
    public getExtensionWithMostCount(): Extension | null {
        if (this.ExtensionList.length === 0) return null;
        return this.ExtensionList.reduce((max, ext) => ext.count > max.count ? ext : max, this.ExtensionList[0]);
    }
}