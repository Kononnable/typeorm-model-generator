/* eslint-disable max-classes-per-file */
class EntityJson {
    public entityName: string;

    public entityOptions: { [key: string]: string | boolean } = {};

    public columns: EntityColumn[] = [] as EntityColumn[];

    public indices: EntityIndex[] = [] as EntityIndex[];
}
class EntityColumn {
    public columnName: string;

    public columnTypes: string[] = [];

    public columnOptions: { [key: string]: string | boolean } = {};

    public joinOptions: { [key: string]: string | boolean }[] = [];

    public relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";

    public isOwnerOfRelation = false;
}
class EntityIndex {
    public indexName: string;

    public columnNames: string[] = [];

    public isUnique = false;

    public fulltext = false;
}

function removeTrailingComas(input: string) {
    return input.replace(/,(?=\s*?[}\]])/g, "");
}

export default class EntityFileToJson {
    public static getEntityOptions(trimmedLine: string, ent: EntityJson): void {
        const decoratorParameters = trimmedLine.slice(
            trimmedLine.indexOf("(") + 1,
            trimmedLine.lastIndexOf(")")
        );
        if (decoratorParameters.length > 0) {
            if (
                decoratorParameters[0] !== '"' ||
                !decoratorParameters.endsWith('"')
            ) {
                let badJSON = decoratorParameters
                    .substring(decoratorParameters.indexOf(",") + 1)
                    .trim();
                if (badJSON.lastIndexOf(",") === badJSON.length - 3) {
                    badJSON =
                        badJSON.slice(0, badJSON.length - 3) +
                        badJSON[badJSON.length - 2] +
                        badJSON[badJSON.length - 1];
                }
                ent.entityOptions = JSON.parse(
                    removeTrailingComas(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                );
            }
        }
    }

    public static getColumnOptionsAndType(
        trimmedLine: string,
        col: EntityColumn
    ): void {
        const decoratorParameters = trimmedLine.slice(
            trimmedLine.indexOf("(") + 1,
            trimmedLine.lastIndexOf(")")
        );
        const primaryGeneratedColumn =
            trimmedLine.substring(0, trimmedLine.indexOf("(")) ===
            "@PrimaryGeneratedColumn";
        if (decoratorParameters.length > 0) {
            if (
                decoratorParameters.search(",") > 0 &&
                !primaryGeneratedColumn
            ) {
                col.columnTypes = decoratorParameters
                    .substring(0, decoratorParameters.indexOf(","))
                    .trim()
                    .split("|");
                let badJSON = decoratorParameters
                    .substring(decoratorParameters.indexOf(",") + 1)
                    .trim();
                if (badJSON.lastIndexOf(",") === badJSON.length - 3) {
                    badJSON =
                        badJSON.slice(0, badJSON.length - 3) +
                        badJSON[badJSON.length - 2] +
                        badJSON[badJSON.length - 1];
                }
                badJSON = badJSON.replace(
                    /default: \(\) => (.*)/,
                    `default: $1`
                );
                col.columnOptions = JSON.parse(
                    removeTrailingComas(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                );
            } else if (
                decoratorParameters[0] === '"' &&
                decoratorParameters.endsWith('"')
            ) {
                col.columnTypes = decoratorParameters
                    .split("|")
                    .map(x => x.trim());
            } else {
                let badJSON = !primaryGeneratedColumn
                    ? decoratorParameters.substring(
                        decoratorParameters.indexOf(",") + 1
                    )
                    : decoratorParameters;
                badJSON = badJSON.trim();
                if (badJSON.lastIndexOf(",") === badJSON.length - 3) {
                    badJSON =
                        badJSON.slice(0, badJSON.length - 3) +
                        badJSON[badJSON.length - 2] +
                        badJSON[badJSON.length - 1];
                }
                col.columnOptions = JSON.parse(
                    removeTrailingComas(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                );
            }
        }
    }

    public static getRelationOptions(
        trimmedLine: string,
        col: EntityColumn
    ): void {
        const decoratorParameters = trimmedLine.slice(
            trimmedLine.indexOf("(") + 1,
            trimmedLine.lastIndexOf(")")
        );
        if (decoratorParameters.length > 0) {
            const params = decoratorParameters.match(/(,)(?!([^{]*}))/g);
            if (params && params.length === 2) {
                let badJSON = decoratorParameters
                    .substring(
                        decoratorParameters.lastIndexOf("{"),
                        decoratorParameters.lastIndexOf("}") + 1
                    )
                    .trim();
                if (badJSON.lastIndexOf(",") === badJSON.length - 3) {
                    badJSON =
                        badJSON.slice(0, badJSON.length - 3) +
                        badJSON[badJSON.length - 2] +
                        badJSON[badJSON.length - 1];
                }
                col.columnOptions = JSON.parse(
                    removeTrailingComas(badJSON
                        .replace(/(')/g, `"`)
                        .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                );
            }
        }
    }

    public static getIndexOptions(trimmedLine: string, ind: EntityIndex): void {
        const decoratorParameters = trimmedLine.slice(
            trimmedLine.indexOf("(") + 1,
            trimmedLine.lastIndexOf(")")
        );

        if (decoratorParameters.length > 0) {
            const containsTables = decoratorParameters.search("\\[") > -1;
            const containsOptions = decoratorParameters.search("{") > -1;
            const containsName = decoratorParameters.search('"') > -1;
            if (containsName) {
                ind.indexName = decoratorParameters.slice(
                    decoratorParameters.indexOf('"') + 1,
                    decoratorParameters
                        .substr(decoratorParameters.indexOf('"') + 1)
                        .indexOf('"') + 1
                );
            }
            if (containsTables) {
                const columnsStr = decoratorParameters.slice(
                    decoratorParameters.indexOf("[") + 1,
                    decoratorParameters.indexOf("]")
                );
                ind.columnNames.push(
                    ...columnsStr
                        .split(",")
                        .map(val => {
                            let colName = "";
                            if (val.search("\\.") > -1) {
                                [, colName] = val.split(".");
                            } else {
                                colName = val.slice(
                                    val.indexOf('"') + 1,
                                    val.lastIndexOf('"')
                                );
                            }
                            return colName;
                        })
                        .filter(v => v.length > 0)
                );
            }
            if (containsOptions) {
                const optionsStr = decoratorParameters.slice(
                    decoratorParameters.indexOf("{") + 1,
                    decoratorParameters.indexOf("}")
                );
                optionsStr.split(",").forEach(v => {
                    if (v.split(":").length - 1 > 0) {
                        switch (optionsStr.split(":")[0].trim()) {
                            case "unique":
                                ind.isUnique =
                                    optionsStr.split(":")[1].trim() === "true";
                                break;
                            case "fulltext":
                                ind.fulltext = optionsStr.split(":")[1].trim() === "true";
                                break;
                            default:
                                console.log(
                                    `[EntityFileToJson:convert] Index option not recognized ${ind.indexName}:`
                                );
                                console.log(`${optionsStr}`);
                                break;
                        }
                    }
                });
            }
        }
    }

    public static convert(entityFile: Buffer): EntityJson {
        const retVal = new EntityJson();

        let isInClassBody = false;
        let isMultilineStatement = false;
        let priorPartOfMultilineStatement = "";

        const lines = entityFile
            .toString()
            .replace("\r", "")
            .split("\n");
        lines.forEach(line => {
            let trimmedLine = line.trim();
            if (trimmedLine.startsWith("//")) {
                return;
            }
            if (isMultilineStatement) {
                trimmedLine = `${priorPartOfMultilineStatement} ${trimmedLine}`;
            }
            if (trimmedLine.length === 0) {
                return;
            }
            if (!isInClassBody) {
                if (trimmedLine.startsWith("import")) {
                    if (
                        EntityFileToJson.isPartOfMultilineStatement(trimmedLine)
                    ) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                    } else {
                        isMultilineStatement = false;
                    }
                    return;
                }
                if (trimmedLine.startsWith("@Entity")) {
                    if (
                        EntityFileToJson.isPartOfMultilineStatement(trimmedLine)
                    ) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                    } else {
                        EntityFileToJson.getEntityOptions(trimmedLine, retVal);
                    }
                    return;
                }
                if (trimmedLine.startsWith("export class")) {
                    retVal.entityName = trimmedLine
                        .substring(
                            trimmedLine.indexOf("class") + 5,
                            trimmedLine.lastIndexOf("{")
                        )
                        .trim()
                        .toLowerCase();
                    isInClassBody = true;
                    return;
                }
                if (trimmedLine.startsWith("@Index")) {
                    if (
                        EntityFileToJson.isPartOfMultilineStatement(trimmedLine)
                    ) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                    } else {
                        isMultilineStatement = false;
                        const ind = new EntityIndex();
                        EntityFileToJson.getIndexOptions(trimmedLine, ind);
                        retVal.indices.push(ind);
                    }
                    return;
                }
            }
            if (trimmedLine.startsWith("@Column")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const col = new EntityColumn();
                    EntityFileToJson.getColumnOptionsAndType(trimmedLine, col);
                    retVal.columns.push(col);
                }
                return;
            }
            if (trimmedLine.startsWith("@PrimaryColumn")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const col = new EntityColumn();
                    EntityFileToJson.getColumnOptionsAndType(trimmedLine, col);
                    col.columnOptions.primary = true;
                    retVal.columns.push(col);
                }
                return;
            }
            if (trimmedLine.startsWith("@VersionColumn")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const col = new EntityColumn();
                    EntityFileToJson.getColumnOptionsAndType(trimmedLine, col);
                    retVal.columns.push(col);
                }
                return;
            }
            if (trimmedLine.startsWith("@PrimaryGeneratedColumn")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const col = new EntityColumn();
                    EntityFileToJson.getColumnOptionsAndType(trimmedLine, col);
                    col.columnOptions.primary = true;
                    col.columnOptions.generated = true;
                    retVal.columns.push(col);
                }
                return;
            }
            if (trimmedLine.startsWith("@ManyToOne")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const column = new EntityColumn();
                    retVal.columns.push(column);
                    column.relationType = "ManyToOne";
                    column.isOwnerOfRelation = true;
                    EntityFileToJson.getRelationOptions(trimmedLine, column);
                }
                return;
            }
            if (trimmedLine.startsWith("@OneToMany")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const column = new EntityColumn();
                    retVal.columns.push(column);
                    column.relationType = "OneToMany";
                    EntityFileToJson.getRelationOptions(trimmedLine, column);
                }
                return;
            }
            if (trimmedLine.startsWith("@ManyToMany")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const column = new EntityColumn();
                    retVal.columns.push(column);
                    column.relationType = "ManyToMany";
                    EntityFileToJson.getRelationOptions(trimmedLine, column);
                }
                return;
            }
            if (trimmedLine.startsWith("@OneToOne")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const column = new EntityColumn();
                    retVal.columns.push(column);
                    column.relationType = "OneToOne";
                    EntityFileToJson.getRelationOptions(trimmedLine, column);
                }
                return;
            }
            if (trimmedLine.startsWith("@JoinColumn")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    retVal.columns[
                        retVal.columns.length - 1
                    ].isOwnerOfRelation = true;
                    const decoratorParameters = trimmedLine
                        .substring(
                            trimmedLine.indexOf("(") + 1,
                            trimmedLine.indexOf(")")
                        )
                        .trim()
                        .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
                    if (decoratorParameters.length > 0) {
                        const column =
                            retVal.columns[retVal.columns.length - 1];
                        const options = JSON.parse(removeTrailingComas(decoratorParameters));
                        if (Array.isArray(options)) {
                            column.joinOptions = options as any;
                        } else {
                            column.joinOptions = [options] as any;
                        }
                    }
                }
                return;
            }
            if (trimmedLine.startsWith("@JoinTable")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const decoratorParameters = trimmedLine
                        .substring(
                            trimmedLine.indexOf("(") + 1,
                            trimmedLine.indexOf(")")
                        )
                        .trim()
                        .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
                    if (decoratorParameters.length > 0) {
                        const column =
                            retVal.columns[retVal.columns.length - 1];
                        const options = JSON.parse(removeTrailingComas(decoratorParameters));
                        if (
                            options.inverseJoinColumn &&
                            !Array.isArray(options.inverseJoinColumn)
                        ) {
                            options.inverseJoinColumns = [
                                options.inverseJoinColumn
                            ];
                            delete options.inverseJoinColumn;
                        }
                        if (
                            options.joinColumn &&
                            !Array.isArray(options.joinColumn)
                        ) {
                            options.joinColumns = [options.joinColumn];
                            delete options.joinColumn;
                        }
                        column.joinOptions = [options];
                    }
                }
                return;
            }
            if (trimmedLine.startsWith("@Index")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    const ind = new EntityIndex();
                    EntityFileToJson.getIndexOptions(trimmedLine, ind);
                    retVal.indices.push(ind);
                }
                return;
            }
            if (trimmedLine.startsWith("constructor")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                }
                return;
            }
            if (trimmedLine.split(":").length - 1 > 0) {
                retVal.columns[
                    retVal.columns.length - 1
                ].columnName = trimmedLine.split(":")[0].trim();
                // TODO:Should check if null only column is nullable?
                let colTypes = trimmedLine
                    .split(":")[1]
                    .split(";")[0]
                    .trim();
                if (colTypes.startsWith("Promise<")) {
                    colTypes = colTypes.substring(8, colTypes.length - 1);
                    retVal.columns[
                        retVal.columns.length - 1
                    ].columnOptions.isTypeLazy = true;
                }
                retVal.columns[
                    retVal.columns.length - 1
                ].columnTypes = colTypes.split("|").map(x => {
                    if (x === "any") {
                        x = "string"; // for json columns
                    }
                    x = x.trim();
                    return x;
                });

                if (
                    !retVal.columns[retVal.columns.length - 1].columnTypes.some(
                        val => val === "null"
                    )
                ) {
                    retVal.columns[retVal.columns.length - 1].columnTypes.push(
                        "null"
                    );
                }
                if (
                    retVal.indices.length > 0 &&
                    retVal.indices[retVal.indices.length - 1].columnNames
                        .length === 0
                ) {
                    retVal.indices[retVal.indices.length - 1].columnNames.push(
                        retVal.columns[retVal.columns.length - 1].columnName
                    );
                }
                return;
            }
            if (trimmedLine === "}") {
                isInClassBody = false;
                return;
            }
            console.log(
                `[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`
            );
            console.log(`${trimmedLine}`);
        });

        retVal.indices = retVal.indices.map(ind => {
            ind.columnNames = ind.columnNames.map(colName => {
                if (colName.endsWith("Id")) {
                    colName = colName.substr(0, colName.length - 2);
                }
                return colName;
            });
            return ind;
        });
        return retVal;
    }

    public static isPartOfMultilineStatement(statement: string): boolean {
        const matchStarting =
            statement.split("(").length + statement.split("{").length;
        const matchEnding =
            statement.split(")").length + statement.split("}").length;
        return !(matchStarting === matchEnding);
    }
}
/* eslint-enable max-classes-per-file */
