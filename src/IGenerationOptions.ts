import path = require("path");

// TODO: change name

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export default interface IGenerationOptions {
    resultsPath: string;
    noConfigs: boolean;
    convertCaseFile: "pascal" | "param" | "camel" | "none";
    convertCaseEntity: "pascal" | "camel" | "none";
    convertCaseProperty: "pascal" | "camel" | "none";
    propertyVisibility: "public" | "protected" | "private" | "none";
    lazy: boolean;
    activeRecord: boolean;
    generateConstructor: boolean;
    customNamingStrategyPath: string;
    relationIds: boolean;
    strictMode: "none" | "?" | "!";
    skipSchema: boolean;
}
export function getDefaultGenerationOptions(): IGenerationOptions {
    const generationOptions: IGenerationOptions = {
        resultsPath: path.resolve(process.cwd(), "output"),
        noConfigs: false,
        convertCaseFile: "pascal",
        convertCaseEntity: "pascal",
        convertCaseProperty: "camel",
        propertyVisibility: "none",
        lazy: false,
        activeRecord: false,
        generateConstructor: false,
        customNamingStrategyPath: "",
        relationIds: false,
        strictMode: "none",
        skipSchema: false
    };
    return generationOptions;
}
