#!/usr/bin/env node
import { ArgumentParser } from "argparse";
import { runCommand, extractCode } from "./utils.js";
import { refactor } from "./refactor.js";
import fs from "fs";
import picocolors from "picocolors";
import * as Backend from "./backend.js";

const parser = new ArgumentParser({
    description: "Automatic refactoring tool",
});

parser.add_argument("--dry-run", { action: "store_true", help: "Dry run" });
parser.add_argument("--revision", { help: "New revision" });
parser.add_argument("--example", { help: "Path to the example" });
parser.add_argument("--note", { action: "append", help: "Note" });
parser.add_argument("path", { nargs: "+", help: "Path to the files" });
parser.add_argument("--backend", { help: "LLM Backend" });

const args = parser.parse_args();

let example = args.example;
let rev = args.revision;
// if --revision is not set, get the last revision of the example file from git log

if (rev === undefined) {
    rev = await runCommand(`git log -n 1 --pretty=format:%H -- ${example}`);
} else if (example === undefined) {
    const files = (
        await runCommand(`git show ${rev} --name-only --pretty=format:`)
    ).split("\n");
    if (files.length !== 1) {
        console.log(
            picocolors.bold(
                picocolors.red("The diff must have exactly one file"),
            ),
        );
        process.exit(1);
    }
    example = files[0];
}

const message = await runCommand(`git show -s --format=%B ${rev}`);

const oldContent = await runCommand(`git show ${rev}~:${example}`);
const newContent = await runCommand(`git show ${rev}:${example}`);

const notes = [
    ...(args.note ?? []),
    "preserve `export`s and comments as much as possible",
    "if the given code is unrelated to the example, skip it",
    "output refactored code without explanation",
];

let backend;
if (args.backend === "claude") {
    backend = new Backend.Claude();
} else {
    backend = new Backend.ChatGPT();
}

for (const file of args.path) {
    if (file === args.example) {
        console.log(`Skipping ${file} as it is the example file`);
        continue;
    }
    console.log(picocolors.bold(picocolors.blue(`Refactoring ${file}...`)));
    const code = fs.readFileSync(file).toString();
    const response = await refactor(
        {
            before: oldContent,
            after: newContent,
            description: message,
            source: code,
            notes,
        },
        backend,
    );

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
