import { Extensions } from "./extensionsModel";
import { Files } from "./filesModel";

export class Group {
    public id: number;
    public name: string;
    public extensions: Extensions | null;
    public files: Files | null;
    constructor(id: number, name: string, extensions: Extensions | null, files: Files | null) {
        this.id = id;
        this.name = name;
        this.extensions = extensions;
        this.files = files;
    }

}