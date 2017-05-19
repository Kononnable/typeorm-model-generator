export class EntityFileToJson {

    convert(entityFile: Buffer): EntityJson {
        let retVal = new EntityJson();

        let isInClassBody = false;
        let isMultilineStatement = false;
        let priorPartOfMultilineStatement = '';

        let lines = entityFile.toString().replace('\r','').split('\n');
        for (let line of lines) {
            let trimmedLine = line.trim();
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
                        retVal.columns.push(new EntityColumn())
                        //TODO:Options, column type if declared
                        continue;
                    }

                } else if (trimmedLine.startsWith('@PrimaryColumn')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        retVal.columns.push(new EntityColumn())
                        //TODO:Options, column type if declared
                        continue;
                    }
                } else if (trimmedLine.startsWith('@PrimaryGeneratedColumn')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        retVal.columns.push(new EntityColumn())
                        //TODO:Options, column type if declared
                        continue;
                    }
                } else if (trimmedLine.startsWith('@ManyToOne')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        retVal.columns.push(new EntityColumn())
                        //TODO:Options,relation options if declared
                        continue;
                    }
                } else if (trimmedLine.startsWith('@OneToMany')) {
                    if (this.isPartOfMultilineStatement(trimmedLine)) {
                        isMultilineStatement = true;
                        priorPartOfMultilineStatement = trimmedLine;
                        continue;
                    } else {
                        isMultilineStatement = false;
                        retVal.columns.push(new EntityColumn())
                        //TODO:Options, relation options if declared
                        continue;
                    }
                } else if (trimmedLine.split(':').length - 1 > 0) {
                    retVal.columns[retVal.columns.length-1].columnName=trimmedLine.split(':')[0].trim();
                    retVal.columns[retVal.columns.length-1].columnType=trimmedLine.split(':')[1].split(';')[0].trim();
                    continue
                }else if(trimmedLine='}'){
                    isInClassBody=false;
                    continue; //class declaration end
                }
            }

            console.log(`[EntityFileToJson:convert] Line not recognized: ${trimmedLine}`)
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
    columnType: string
}