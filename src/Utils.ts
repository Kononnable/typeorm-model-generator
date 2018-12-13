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
            (packagejson as any).bugs.url
        }`
    );
    if (isABug && !errObject) {
        errObject = new Error().stack;
    }
    if (!!errObject) {
        console.error(errObject);
    }
}
export function packageVersion() {
    return `${(packagejson as any).name}@${(packagejson as any).version}`;
}
