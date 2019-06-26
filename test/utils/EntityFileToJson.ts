export class EntityFileToJson {
    public getEntityOptions(trimmedLine: string, ent: EntityJson) {
        const decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))
        if (decoratorParameters.length > 0) {
            if (decoratorParameters[0] != '"' || !decoratorParameters.endsWith('"')) {
                let badJSON = decoratorParameters.substring(decoratorParameters.indexOf(',') + 1).trim()
                if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                    badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                }
                ent.entityOptions = JSON.parse(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
            }
        }
    }
    public getColumnOptionsAndType(trimmedLine: string, col: EntityColumn) {
        const decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))
        const primaryGeneratedColumn = trimmedLine.substring(0, trimmedLine.indexOf('('))=='@PrimaryGeneratedColumn'
        if (decoratorParameters.length > 0) {
            if (decoratorParameters.search(',') > 0 && !primaryGeneratedColumn) {
                col.columnTypes = decoratorParameters.substring(0, decoratorParameters.indexOf(',')).trim().split('|');
                let badJSON = decoratorParameters.substring(decoratorParameters.indexOf(',') + 1).trim()
                if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                    badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                }
                badJSON = badJSON.replace(/default: \(\): string => (.*)/, `default: $1`)
                col.columnOptions = JSON.parse(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
            } else {
                if (decoratorParameters[0] == '"' && decoratorParameters.endsWith('"')) {
                    col.columnTypes = decoratorParameters.split('|').map( x=>x.trim())
                } else {
                    let badJSON = !primaryGeneratedColumn ? decoratorParameters.substring(decoratorParameters.indexOf(',') + 1) : decoratorParameters
                    badJSON = badJSON.trim()
                    if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                        badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                    }
                    col.columnOptions = JSON.parse(badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
                }
            }
        }
    }
    public getRelationOptions(trimmedLine:string, col:EntityColumn){
        const decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))
         if (decoratorParameters.length > 0) {
             const params = decoratorParameters.match(/(,)(?!([^{]*}))/g)
            if ( params && params.length == 2) {
                let badJSON = decoratorParameters.substring( decoratorParameters.lastIndexOf('{'),decoratorParameters.lastIndexOf('}')+1).trim()
                if (badJSON.lastIndexOf(',') == badJSON.length - 3) {
                    badJSON = badJSON.slice(0, badJSON.length - 3) + badJSON[badJSON.length - 2] + badJSON[badJSON.length - 1]
                }
                col.columnOptions = JSON.parse(badJSON.replace(/(')/g,`"`).replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '))
            }
        }
    }
    public getIndexOptions(trimmedLine: string, ind: EntityIndex) {
        const decoratorParameters = trimmedLine.slice(trimmedLine.indexOf('(') + 1, trimmedLine.lastIndexOf(')'))

        if (decoratorParameters.length > 0) {
            const containsTables = decoratorParameters.search('\\[') > -1
            const containsOptions = decoratorParameters.search('{') > -1
            const containsName = decoratorParameters.search('"') > -1
            if (containsName) {
                ind.indexName = decoratorParameters.slice(decoratorParameters.indexOf('"') + 1, decoratorParameters.substr(decoratorParameters.indexOf('"') + 1).indexOf('"'))
            }
            if (containsTables) {
                const columnsStr = decoratorParameters.slice(decoratorParameters.indexOf('[') + 1, decoratorParameters.indexOf(']'))
                ind.columnNames.push(...columnsStr.split(',').map((val) => {
                    let colName = ''
                    if (val.search('\\.') > -1) {
                        colName = val.split('.')[1]
                    } else {
                        colName = val.slice(val.indexOf('"') + 1, val.lastIndexOf('"'))
                    }
                    return colName
                }).filter(v =>  v.length > 0))
            }
            if (containsOptions) {
                const optionsStr = decoratorParameters.slice(decoratorParameters.indexOf('{') + 1, decoratorParameters.indexOf('}'))
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

    public convert(entityFile: Buffer): EntityJson {
        const retVal = new EntityJson();

        let isInClassBody = false;
        let isMultilineStatement = false;
        let priorPartOfMultilineStatement = '';

        const lines = entityFile.toString().replace('\r', '').split('\n');
        for (const line of lines) {
            let trimmedLine = line.trim();
            if (trimmedLine.startsWith('//')) {
                continue;
            }
            if (isMultilineStatement) {
                trimmedLine = priorPartOfMultilineStatement + ' ' + trimmedLine
            }
            if (trimmedLine.length == 0) {
                continue;
            }
            else if (!isInClassBody) {
                if (trimmedLine.startsWith('import')) {
                    continue;
                } else if (trimmedLine.startsWith('@Entity')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        this.getEntityOptions(trimmedLine, retVal);
                        continue;
                    }
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
                        const ind = new EntityIndex()
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
                        const col = new EntityColumn()
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
                        const col = new EntityColumn()
                        this.getColumnOptionsAndType(trimmedLine, col)
                        col.columnOptions.primary = true
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
                        const col = new EntityColumn()
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
                        const col = new EntityColumn()
                        this.getColumnOptionsAndType(trimmedLine, col)
                        col.columnOptions.primary = true
                        col.columnOptions.generated = true
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
                        const column = new EntityColumn()
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
                        const column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "OneToMany"
                        continue;
                    }
                } else if (trimmedLine.startsWith('@ManyToMany')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        const column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "ManyToMany"
                        continue;
                    }
                } else if (trimmedLine.startsWith('@OneToOne')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        const column = new EntityColumn()
                        retVal.columns.push(column)
                        column.relationType = "OneToOne"
                        this.getRelationOptions(trimmedLine,column);
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
                } else if (trimmedLine.startsWith('@JoinTable')) {
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
                        const ind = new EntityIndex()
                        this.getIndexOptions(trimmedLine, ind)
                        retVal.indicies.push(ind);
                        continue;
                    }
                } else if (trimmedLine.startsWith('constructor')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        continue;
                    }
                } else if (trimmedLine.split(':').length - 1 > 0) {
                    retVal.columns[retVal.columns.length - 1].columnName = trimmedLine.split(':')[0].trim();
                    // TODO:Should check if null only column is nullable?
                    let colTypes=trimmedLine.split(':')[1].split(';')[0].trim();
                    if (colTypes.startsWith('Promise<')) {
                        colTypes=colTypes.substring(8,colTypes.length-1)
                        retVal.columns[retVal.columns.length - 1].columnOptions.isLazy=true;
                    }
                    retVal.columns[retVal.columns.length - 1].columnTypes = colTypes.split('|').map(function (x) {
                        if (x == 'any') {
                            x = 'string' // for json columns
                        }
                        x = x.trim();
                        return x;
                    });

                    if (!retVal.columns[retVal.columns.length - 1].columnTypes.some( (val) =>  val == "null" ? true : false)) {
                     retVal.columns[retVal.columns.length - 1].columnTypes.push('null')
                    }
                    if (retVal.indicies.length > 0 && retVal.indicies[retVal.indicies.length - 1].columnNames.length == 0) {
                        retVal.indicies[retVal.indicies.length - 1].columnNames.push(retVal.columns[retVal.columns.length - 1].columnName)
                    }
                    continue
                } else if (trimmedLine == '}') {
                    isInClassBody = false;
                    continue;
                }
                else {
                    console.log(`[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`)
                    console.log(`${trimmedLine}`)
                }
            }
            console.log(`[EntityFileToJson:convert] Line not recognized in entity ${retVal.entityName}:`)
            console.log(`${trimmedLine}`)
        }

        retVal.columns = retVal.columns.map(col => {
            if (col.columnName.endsWith('Id')) {
                col.columnName = col.columnName.substr(0, col.columnName.length - 2)
            }
            return col;
        })
        retVal.indicies = retVal.indicies.map(ind => {
            ind.columnNames = ind.columnNames.map(colName => {
                if (colName.endsWith('Id')) {
                    colName = colName.substr(0, colName.length - 2)
                }
                return colName;
            })
            return ind;
        })
        return retVal;
    }
    public isPartOfMultilineStatement(statement: string) {
        const matchStarting = statement.split('(').length+statement.split('{').length
        const matchEnding = statement.split(')').length+statement.split('}').length
        return !(matchStarting == matchEnding)
    }
}
class EntityJson {
    public entityName: string
    public entityOptions: any = {}
    public columns: EntityColumn[] = [] as EntityColumn[];
    public indicies: EntityIndex[] = [] as EntityIndex[];
}
class EntityColumn {
    public columnName: string
    public columnTypes: string[] = []
    public columnOptions: any = {}
    public relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany" | "None" = "None"
    public isOwnerOfRelation: boolean = false;
}
class EntityIndex {
    public indexName: string
    public columnNames: string[] = []
    public isUnique: boolean = false
}
