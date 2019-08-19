/* eslint-disable max-classes-per-file */
class EntityJson {
    public entityName: string;

    public entityOptions: any = {};

    public columns: EntityColumn[] = [] as EntityColumn[];

    public indicies: EntityIndex[] = [] as EntityIndex[];
}
class EntityColumn {
    public columnName: string;

    public columnTypes: string[] = [];

    public columnOptions: any = {};

    public relationType:
        | "OneToOne"
        | "OneToMany"
        | "ManyToOne"
        | "ManyToMany"
        | "None" = "None";

    public isOwnerOfRelation: boolean = false;
}
class EntityIndex {
    public indexName: string;

    public columnNames: string[] = [];

    public isUnique: boolean = false;
}

export default class EntityFileToJson {
    public static getEntityOptions(trimmedLine: string, ent: EntityJson) {
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
                    badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
                );
            }
        }
    }

    public static getColumnOptionsAndType(
        trimmedLine: string,
        col: EntityColumn
    ) {
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
                    badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
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
                    badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
                );
            }
        }
    }

    public static getRelationOptions(trimmedLine: string, col: EntityColumn) {
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
                    badJSON
                        .replace(/(')/g, `"`)
                        .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
                );
            }
        }
    }

    public static getIndexOptions(trimmedLine: string, ind: EntityIndex) {
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
                        .indexOf('"')
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
                        retVal.indicies.push(ind);
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
                }
                return;
            }
            if (trimmedLine.startsWith("@JoinTable")) {
                if (EntityFileToJson.isPartOfMultilineStatement(trimmedLine)) {
                    isMultilineStatement = true;
                    priorPartOfMultilineStatement = trimmedLine;
                } else {
                    isMultilineStatement = false;
                    retVal.columns[
                        retVal.columns.length - 1
                    ].isOwnerOfRelation = true;
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
                    retVal.indicies.push(ind);
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
                    ].columnOptions.isLazy = true;
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
                    retVal.indicies.length > 0 &&
                    retVal.indicies[retVal.indicies.length - 1].columnNames
                        .length === 0
                ) {
                    retVal.indicies[
                        retVal.indicies.length - 1
                    ].columnNames.push(
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

        retVal.columns = retVal.columns.map(col => {
            if (col.columnName.endsWith("Id")) {
                col.columnName = col.columnName.substr(
                    0,
                    col.columnName.length - 2
                );
            }
            return col;
        });
        retVal.indicies = retVal.indicies.map(ind => {
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

    public static isPartOfMultilineStatement(statement: string) {
        const matchStarting =
            statement.split("(").length + statement.split("{").length;
        const matchEnding =
            statement.split(")").length + statement.split("}").length;
        return !(matchStarting === matchEnding);
    }
}
/* eslint-enable max-classes-per-file */
