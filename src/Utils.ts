import * as packagejson from "../package.json";
import { Entity } from "./models/Entity";

export function LogError(
    errText: string,
    isABug: boolean = true,
    passedError?: string | ErrorConstructor
) {
    let errObject = passedError;
    console.error(errText);
    console.error(`Error occured in typeorm-model-generator.`);
    console.error(`${packageVersion()}  node@${process.version}`);
    console.error(
        `If you think this is a bug please open an issue including this log on ${packagejson.bugs.url}`
    );
    if (isABug && !passedError) {
        errObject = new Error().stack;
    }
    if (errObject) {
        console.error(errObject);
    }
}
export function packageVersion() {
    return `${packagejson.name}@${packagejson.version}`;
}
export function findNameForNewField(
    _fieldName: string,
    entity: Entity,
    columnOldName = ""
) {
    let fieldName = _fieldName;
    const validNameCondition = () =>
        (entity.columns.every(
            v => v.tscName.toLowerCase() !== fieldName.toLowerCase()
        ) &&
            entity.relations.every(
                v => v.fieldName.toLowerCase() !== fieldName.toLowerCase()
            ) &&
            entity.relationIds.every(
                v => v.fieldName.toLowerCase() !== fieldName.toLowerCase()
            )) ||
        (columnOldName &&
            columnOldName.toLowerCase() === fieldName.toLowerCase());
    if (!validNameCondition()) {
        fieldName += "_";
        for (
            let i = 2;
            i <= entity.columns.length + entity.relations.length;
            i++
        ) {
            fieldName =
                fieldName.substring(0, fieldName.length - i.toString().length) +
                i.toString();
            if (validNameCondition()) {
                break;
            }
        }
    }
    return fieldName;
}
