import * as packagejson from "./../../package.json";
export function LogError(
    errText: string,
    isABug: boolean = true,
    errObject?: any
) {
    console.error(errText);
    console.error(`Error occured in typeorm-model-generator.`);
    console.error(`${packageVersion()}  node@${process.version}`);
    console.error(
        `If you think this is a bug please open an issue including this log on ${
            (<any>packagejson).bugs.url
        }`
    );
    if (isABug && !errObject) errObject = new Error().stack;
    if (!!errObject) console.error(errObject);
    // process.abort();
}
export function packageVersion() {
    return `${(<any>packagejson).name}@${(<any>packagejson).version}`;
}
