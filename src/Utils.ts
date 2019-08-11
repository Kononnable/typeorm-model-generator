import * as packagejson from "../package.json";

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
