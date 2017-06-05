export class EntityFileToJson {
    getColumnOptionsAndType(trimmedLine: string, col: EntityColumn) {
        let decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))

        if (decoratorParameters.length > 0) {
            if (decoratorParameters.search(',') > 0) {
                col.columnTypes = decoratorParameters.substring(0, decoratorParameters.indexOf(',')).trim().split('|').map(function (x) {
                        // if (!x.endsWith('[]')) {
                        //     x = x + '[]'// can't distinguish OneTwoMany from OneToOne without indexes
                        // }
                        return x;
                    });
                let badJSON = decoratorParameters.substring(decoratorParameters.indexOf(',') + 1).trim()
                if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                    badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                }
                col.columnOptions = JSON.parse(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
            } else {
                if (decoratorParameters[0] == '"' && decoratorParameters.endsWith('"')) {
                    col.columnTypes = decoratorParameters.split('|').map(function (x) {
                        // if (!x.endsWith('[]')) {
                        //     x = x + '[]'// can't distinguish OneTwoMany from OneToOne without indexes
                        // }
                        return x;
                    });
                } else {
                    let badJSON = decoratorParameters.substring(decoratorParameters.indexOf(',') + 1).trim()
                    if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                        badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                    }
                    col.columnOptions = JSON.parse(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                }
            }
        }
    }

    convert(entityFile: Buffer): EntityJson {
        let retVal = new EntityJson();

        let isInClassBody = false;
        let isMultilineStatement = false;
        let priorPartOfMultilineStatement = '';

        let lines = entityFile.toString().replace('\r', '').split('\n');
        for (let line of lines) {
            let trimmedLine = line.trim();
            if (trimmedLine.startsWith('//')) {
                continue; //commented line   
            }
            if (isMultilineStatement)
                trimmedLine = priorPartOfMultilineStatement + ' ' + trimmedLine
            if (trimmedLine.length == 0)
                continue;//empty line

            else if (!isInClassBody) {
                if (trimmedLine.startsWith('import')) {
                    continue; //import statement is not part of entity definition   
                } else if (trimmedLine.startsWith('@Entity')) {
                    continue; //TODO:entity options
                } else if (trimmedLine.startsWith('export class')) {
                    retVal.entityName = trimmedLine.substring(trimmedLine.indexOf('class') + 5, trimmedLine.lastIndexOf('{')).trim().toLowerCase()
                    isInClassBody = true;
                    continue;
                }
            } else {
                if (trimmedLine.startsWith('@Column')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let col = new EntityColumn()
                        this.getColumnOptionsAndType(trimmedLine, col)
                        retVal.columns.push(col);
                        continue;
                    }

                } else if (trimmedLine.startsWith('@PrimaryColumn')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let col = new EntityColumn()
                        this.getColumnOptionsAndType(trimmedLine, col)
                        col.columnOptions['primary'] = true
                        retVal.columns.push(col);
                        continue;
                    }
                } else if (trimmedLine.startsWith('@PrimaryGeneratedColumn')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let col = new EntityColumn()
                        this.getColumnOptionsAndType(trimmedLine, col)
                        col.columnOptions['primary'] = true
                        col.columnOptions['generated'] = true
                        retVal.columns.push(col);
                        continue;
                    }
                } else if (trimmedLine.startsWith('@ManyToOne')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "ManyToOne"
                        continue;
                    }
                } else if (trimmedLine.startsWith('@OneToMany')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "OneToMany"
                        continue;
                    }
                } else if (trimmedLine.startsWith('@OneToOne')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "OneToOne"
                        continue;
                    }
                } else if (trimmedLine.startsWith('@JoinColumn')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        retVal.columns[retVal.columns.length - 1].isOwnerOfRelation = true;
                        continue;
                    }
                } else if (trimmedLine.split(':').length - 1 > 0) {
                    retVal.columns[retVal.columns.length - 1].columnName = trimmedLine.split(':')[0].trim();
                    //TODO:Should check if null only column is nullable?
                    retVal.columns[retVal.columns.length - 1].columnTypes = trimmedLine.split(':')[1].split(';')[0].trim().split('|').map(function (x) {
                        // if (!x.endsWith('[]')) {
                        //     x = x + '[]'// can't distinguish OneTwoMany from OneToOne without indexes
                        // }
                        return x;
                    });
                   
                    if (!retVal.columns[retVal.columns.length - 1].columnTypes.some(function (this, val, ind, arr) {
                        return val == "null" ? true : false;
                    })) retVal.columns[retVal.columns.length - 1].columnTypes.push('null')

                    continue
                } else if (trimmedLine = '}') {
                    isInClassBody = false;
                    continue; //class declaration end
                }
            }

            console.log(`[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`)
            console.log(`${trimmedLine}`)
        }
        return retVal;
    }
    isPartOfMultilineStatement(statement: string) {
        let matchStarting = statement.split('(').length - 1
        let matchEnding = statement.split(')').length - 1

        return !(matchStarting == matchEnding)
    }
}
class EntityJson {
    entityName: string
    entityOptions: any = {}

    columns: EntityColumn[] = <EntityColumn[]>[];
}
class EntityColumn {
    columnName: string
    columnTypes: string[]
    columnOptions: any = {}
    relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "None" = "None"
    isOwnerOfRelation: boolean = false;
}