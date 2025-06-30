import { Group } from "./groupModel";

export class Groups {
    private GroupList: Array<Group> = [];

    public getLastID(): number {
        if (this.GroupList.length == 0) return 0;

        const lastID = this.GroupList[this.GroupList.length - 1].id;
        return lastID;
    }

    public getGroupByID(id: number): Group | null {
        if (this.GroupList.length == 0) return null;

        const Group = this.GroupList.find(f => f.id === id);
        return Group ?? null;
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
        const result = this.GroupList.findIndex(f => f.name === groupName);
        return result == -1 ? false : true;
    }
    public deleteGroupByID(id: number) {
        this.GroupList = this.GroupList.filter(group => group.id !== id);
    }
    public clear() {
        this.GroupList = [];
    }
    public empty() {
        let counter = 0;
        this.GroupList.forEach(group => {
            if (group.extensions != null || group.files != null) {
                if ((group.extensions && group.extensions.getExtensionsCount() > 0) || (group.files && group.files.getFilesCount() > 0)) {
                    counter++;
                }
            }
        });
        return counter < 1;
    }
}