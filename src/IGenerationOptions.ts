export default class IGenerationOptions {
    public resultsPath = "";

    public noConfigs = false;

    public convertCaseFile: "pascal" | "param" | "camel" | "none" = "none";

    public convertCaseEntity: "pascal" | "camel" | "none" = "none";

    public convertCaseProperty: "pascal" | "camel" | "none" = "none";

    public propertyVisibility: "public" | "protected" | "private" | "none" =
        "none";

    public lazy = false;

    public activeRecord = false;

    public generateConstructor = false;

    public customNamingStrategyPath = "";

    public relationIds = false;

    public strictMode: false | "?" | "!" = false;

    public skipSchema = false;
}
