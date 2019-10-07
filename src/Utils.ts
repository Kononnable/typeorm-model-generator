import * as packagejson from "../package.json";
import { Entity } from "./models/Entity";

export function LogError(
    errText: string,
    isABug: boolean = true,
    passedError?: any
) {
    let errObject = passedError;
    console.error(errText);
    console.error(`Error occured in typeorm-model-generator.`);
    console.error(`${packageVersion()}  node@${process.version}`);
    console.error(
        `If you think this is a bug please open an issue including this log on ${
            (packagejson as any).bugs.url
        }`
    );
    if (isABug && !passedError) {
        errObject = new Error().stack;
    }
    if (errObject) {
        console.error(errObject);
    }
}
export function packageVersion() {
    return `${(packagejson as any).name}@${(packagejson as any).version}`;
}
export function findNameForNewField(
    _fieldName: string,
    entity: Entity,
    columnOldName = ""
) {
    let fieldName = _fieldName;
    const validNameCondition = () =>
        (entity.columns.every(v => v.tscName !== fieldName) &&
            entity.relations.every(v => v.fieldName !== fieldName)) ||
        (columnOldName && columnOldName === fieldName);
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
