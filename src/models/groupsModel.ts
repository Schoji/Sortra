import { Group } from "./groupModel";

export class Groups {
    private GroupList: Array<Group> = [];

    public getLastID(): number {
        if (this.GroupList.length == 0) return 0;

        const lastID = this.GroupList[this.GroupList.length - 1].id;
        return lastID;
    }

    public getGroupByID(id: number): Group | null {
        return this.GroupList.find(g => g.id === id) ?? null;
    }

    public getGroupList(): Array<Group> {
        return this.GroupList;
    }

    public getGroupsCount(): number {
        return this.GroupList.length;
    }

    public addGroup(newGroup: Group) {
        this.GroupList.push(newGroup);
    }

    public groupExistsByName(groupName: string) {
        return this.GroupList.some(g => g.name === groupName);
    }
    public deleteGroupByID(id: number) {
        this.GroupList = this.GroupList.filter(group => group.id !== id);
    }
    public clear() {
        this.GroupList = [];
    }
    public empty() {
        return !this.GroupList.some(group =>
            (group.extensions?.getExtensionsCount() ?? 0) > 0 ||
            (group.files?.getFilesCount() ?? 0) > 0
        );
    }
    public clearItems() {
        this.GroupList.forEach(group => {
            group.extensions?.clear();
            group.files?.clear();
        });
    }
}