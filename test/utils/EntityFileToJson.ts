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
                        x=x.trim();
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
    getIndexOptions(trimmedLine: string, ind: EntityIndex) {
        let decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))

        if (decoratorParameters.length > 0) {
            let containsTables = decoratorParameters.search('\\[') > -1
            let containsOptions = decoratorParameters.search('{') > -1
            let containsName = decoratorParameters.search('"') > -1//TODO:no name, but fields as string[]
            if (containsName) {

                ind.indexName = decoratorParameters.slice(decoratorParameters.indexOf('"') + 1, decoratorParameters.substr(decoratorParameters.indexOf('"') + 1).indexOf('"'))
            }
            if (containsTables) {
                let columnsStr = decoratorParameters.slice(decoratorParameters.indexOf('[') + 1, decoratorParameters.indexOf(']'))
                ind.columnNames.push(...columnsStr.split(',').map((val) => {
                    let colName = ''
                    if (val.search('\\.') > -1) {
                        colName = val.split('.')[1]
                    } else {
                        colName = val.slice(val.indexOf('"') + 1, val.lastIndexOf('"'))
                    }
                    return colName
                }).filter(v => {
                    return v.length > 0
                }))

            }
            if (containsOptions) {
                let optionsStr = decoratorParameters.slice(decoratorParameters.indexOf('{') + 1, decoratorParameters.indexOf('}'))
                optionsStr.split(',').forEach((v) => {
                    if (v.split(':').length - 1 > 0) {
                        switch (optionsStr.split(':')[0].trim()) {
                            case "unique":
                                ind.isUnique = optionsStr.split(':')[1].trim() == 'true' ? true : false;
                                break;

                            default:
                                console.log(`[EntityFileToJson:convert] Index option not recognized ${ind.indexName}:`)
                                console.log(`${optionsStr}`)
                                break;
                        }
                    }
                })

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
                } else if (trimmedLine.startsWith('@Index')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let ind = new EntityIndex()
                        this.getIndexOptions(trimmedLine, ind)
                        retVal.indicies.push(ind);
                        continue;
                    }
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
                } else if (trimmedLine.startsWith('@VersionColumn')) {
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
                        column.isOwnerOfRelation = true;
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
                } else if (trimmedLine.startsWith('@Index')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        let ind = new EntityIndex()
                        this.getIndexOptions(trimmedLine, ind)
                        retVal.indicies.push(ind);
                        continue;
                    }
                } else if (trimmedLine.split(':').length - 1 > 0) {
                    retVal.columns[retVal.columns.length - 1].columnName = trimmedLine.split(':')[0].trim();
                    //TODO:Should check if null only column is nullable?
                    retVal.columns[retVal.columns.length - 1].columnTypes = trimmedLine.split(':')[1].split(';')[0].trim().split('|').map(function (x) {
                        if (x == 'any') {
                            x = 'string' //for json columns
                        }
                        // if (!x.endsWith('[]')) {
                        //     x = x + '[]'// can't distinguish OneTwoMany from OneToOne without indexes
                        // }
                        x=x.trim();
                        return x;
                    });

                    if (!retVal.columns[retVal.columns.length - 1].columnTypes.some(function (this, val, ind, arr) {
                        return val == "null" ? true : false;
                    })) retVal.columns[retVal.columns.length - 1].columnTypes.push('null')
                    if (retVal.indicies.length > 0 && retVal.indicies[retVal.indicies.length - 1].columnNames.length == 0) {
                        retVal.indicies[retVal.indicies.length - 1].columnNames.push(retVal.columns[retVal.columns.length - 1].columnName)
                    }
                    retVal.indicies.forEach(ind => {
                        if (ind.isUnique && ind.columnNames.length == 1 && ind.columnNames[0] == retVal.columns[retVal.columns.length - 1].columnName) {
                            retVal.columns[retVal.columns.length - 1].columnOptions['unique'] = true
                        }
                    })
                    continue
                } else if (trimmedLine == '}') {
                    isInClassBody = false;
                    continue; //class declaration end
                }
                else {
                    console.log(`[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`)
                    console.log(`${trimmedLine}`)
                }
            }

            console.log(`[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`)
            console.log(`${trimmedLine}`)
        }

        retVal.columns=retVal.columns.map(col=>{
            if (col.columnName.endsWith('Id'))
            col.columnName=col.columnName.substr(0,col.columnName.length-2)
            return col;
        })
        retVal.indicies=retVal.indicies.map(ind=>{
            ind.columnNames=ind.columnNames.map(colName=>{
                if (colName.endsWith('Id'))
                colName=colName.substr(0,colName.length-2)
                return colName;
            })
            return ind;
        })
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
    indicies: EntityIndex[] = <EntityIndex[]>[];
}
class EntityColumn {
    columnName: string
    columnTypes: string[] = []
    columnOptions: any = {}
    relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "None" = "None"
    isOwnerOfRelation: boolean = false;
}
class EntityIndex {
    indexName: string
    columnNames: string[] = []
    isUnique: boolean = false
}