export default class IGenerationOptions {
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

    public customNamingStrategyPath: string = "";

    public relationIds: boolean = false;

    public strictMode: false | "?" | "!" = false;

    public skipSchema: boolean = false;
}
