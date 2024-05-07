#!/usr/bin/env node
import { ArgumentParser } from "argparse";
import { runCommand, extractCode } from "./utils.js";
import { refactor } from "./refactor.js";
import fs from "fs";
import picocolors from "picocolors";

const parser = new ArgumentParser({
    description: "Automatic refactoring tool",
});

parser.add_argument("--dry-run", { action: "store_true", help: "Dry run" });
parser.add_argument("--revision", { help: "New revision" });
parser.add_argument("--model", { help: "Path to the model" });
parser.add_argument("--note", { action: "append", help: "Note" });
parser.add_argument("path", { nargs: "+", help: "Path to the files" });

const args = parser.parse_args();

// if --revision is not set, get the last revision of the model file from git log
const rev =
    args.revision ??
    (await runCommand(`git log -n 1 --pretty=format:%H -- ${args.model}`));

const message = await runCommand(`git show -s --format=%B ${rev}`);

const oldContent = await runCommand(`git show ${rev}~:${args.model}`);
const newContent = await runCommand(`git show ${rev}:${args.model}`);

const notes = [
    ...args.note ?? [],
    "preserve exports and comments",
    "output refactored code without explanation",
];

for (const file of args.path) {
    if (file === args.model) {
        console.log(`Skipping ${file} as it is the model file`);
        continue;
    }
    console.log(picocolors.bold(picocolors.blue(`Refactoring ${file}...`)));
    const code = fs.readFileSync(file).toString();
    const response = await refactor({
        before: oldContent,
        after: newContent,
        description: message,
        source: code,
        notes,
    });

    const newCode = extractCode(response, args.dry_run);
    if (!newCode) {
        console.log(
            picocolors.bold(picocolors.red(`Failed to refactor ${file}`)),
        );
        continue;
    }
    if (!args.dry_run) fs.writeFileSync(file, newCode);
    console.log(picocolors.bold(picocolors.green(`Refactored ${file}`)));
}
