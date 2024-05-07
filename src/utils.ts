import * as child_process from "child_process";
import picocolors from "picocolors";

export function runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(picocolors.red(stderr));
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function extractCode(
    response: string,
    debug: boolean,
): string | undefined {
    let result = [];
    // extract the code from the response
    let flag = false;
    for (const line of response.split("\n")) {
        if (flag) {
            if (line.startsWith("```")) {
                break;
            }
            result.push(line);
            if (debug) {
                console.log(line);
            }
        } else {
            if (line.startsWith("```")) {
                flag = true;
                continue;
            }
            // print to stderr
            console.error(picocolors.gray(line));
        }
    }
    return result.length === 0 ? undefined : result.join("\n");
}
