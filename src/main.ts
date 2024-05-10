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

// if --revision is not set, get the last revision of the example file from git log
const rev =
    args.revision ??
    (await runCommand(`git log -n 1 --pretty=format:%H -- ${args.example}`));

const message = await runCommand(`git show -s --format=%B ${rev}`);

const oldContent = await runCommand(`git show ${rev}~:${args.example}`);
const newContent = await runCommand(`git show ${rev}:${args.example}`);

const notes = [
    ...(args.note ?? []),
    "preserve `export`s as much as possible",
    "if the given code is unrelated to the example, skip it",
    "if you have any questions, add comments prefixed with `XXX: `",
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
