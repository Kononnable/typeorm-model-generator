import * as changeCase from "change-case";
import * as packagejson from "../package.json";
import { Entity } from "./models/Entity";

export function LogError(
    errText: string,
    isABug = true,
    passedError?: string | ErrorConstructor
): void {
    let errObject = passedError;
    console.error(errText);
    console.error(`Error occurred in typeorm-model-generator.`);
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
export function packageVersion(): string {
    return `${packagejson.name}@${packagejson.version}`;
}
export function findNameForNewField(
    _fieldName: string,
    entity: Entity,
    columnOldName = ""
): string {
    let fieldName = _fieldName;
    const validNameCondition = () =>
        (entity.columns.every(
            v =>
                changeCase.camelCase(v.tscName) !==
                changeCase.camelCase(fieldName)
        ) &&
            entity.relations.every(
                v =>
                    changeCase.camelCase(v.fieldName) !==
                    changeCase.camelCase(fieldName)
            ) &&
            entity.relationIds.every(
                v =>
                    changeCase.camelCase(v.fieldName) !==
                    changeCase.camelCase(fieldName)
            )) ||
        (columnOldName &&
            changeCase.camelCase(columnOldName) ===
                changeCase.camelCase(fieldName));
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
