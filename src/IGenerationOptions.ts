import { AbstractNamingStrategy } from "./AbstractNamingStrategy";
import { NamingStrategy } from "./NamingStrategy";
export class IGenerationOptions {
    public resultsPath: string = "";
    public noConfigs: boolean = false;
    public convertCaseFile: "pascal" | "param" | "camel" | "none" = "none";
    public convertCaseEntity: "pascal" | "camel" | "none" = "none";
    public convertCaseProperty: "pascal" | "camel" | "none" = "none";
    public propertyVisibility: "public" | "protected" | "private" | "none" =
        "none";
    public lazy: boolean = false;
    public activeRecord: boolean = false;
    public generateConstructor: boolean = false;
    public namingStrategy: AbstractNamingStrategy = new NamingStrategy();
    public relationIds: boolean = false;
}
