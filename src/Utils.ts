import * as data from "./../../package.json";
export function LogError(
    errText: string,
    isABug: boolean = true,
    errObject?: any
) {
    let x = <any>data;
    console.error(errText);
    console.error(`Error occured in typeorm-model-generator.`);
    console.error(`${x.name}@${x.version}  node@${process.version}`);
    console.error(
        `If you think this is a bug please open an issue including this log on ${
            x.bugs.url
        }`
    );
    if (isABug && !errObject) errObject = new Error().stack;
    if (!!errObject) console.error(errObject);
    // process.abort();
}
