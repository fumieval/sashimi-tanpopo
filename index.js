import { ArgumentParser } from 'argparse';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const parser = new ArgumentParser({
    description: 'Automatic refactoring tool',
});

parser.add_argument('--dry-run', { action: 'store_true', help: 'Dry run' });
parser.add_argument('--revision', { help: 'New revision' });
parser.add_argument('--model', { help: 'Path to the model' });
parser.add_argument('--note', { action: 'append', help: 'Note' });
parser.add_argument('path', { nargs: '+', help: 'Path to the files' });

const args = parser.parse_args();

// if --revision is not set, get the last revision of the model file from git log
const rev = args.revision ?? execSync(`git log -n 1 --pretty=format:%H -- ${args.model}`).toString();

const message = execSync(`git show -s --format=%B ${rev}`).toString();

const oldContent = execSync(`git show ${rev}~:${args.model}`).toString();
const newContent = execSync(`git show ${rev}:${args.model}`).toString();

const ext = path.extname(args.model).slice(1);

function extractCode(response) {
    let result = [];
    // extract the code from the response
    let flag = false;
    for (const line of response.split('\n')) {
        if (flag) {
            if (line.startsWith('```')) {
                break;
            }
            result.push(line);
        } else {
            if (line.startsWith('```')) {
                flag = true;
                console.log('<code>');
                continue;
            }
            // print to stderr
            console.error(chalk.grey(line));
        }
    }
    return result.length === 0 ? undefined : result.join('\n');
}

async function refactor(code) {
    const prompt = `We are trying to refactor some code.

Here's an example of the code before and after refactoring.

Before:

\`\`\`${ext}
${oldContent}
\`\`\`

After:

\`\`\`${ext}
${newContent}
\`\`\`

Explanation:
${message}

Now, this is the code we are trying to refactor:

\`\`\`${ext}
${code}
\`\`\`

${args.note ? args.note.map(line => `* ${line}`).join('\n') : ''}

Output the refactored code.`;

    const msg = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });

    return msg.content[0].text;
}

function handleResponse(response, dest) {
    if (args.dry_run) {
        console.log(chalk.grey(response));
    } else {
        const newCode = extractCode(response);
        if (!newCode) {
            console.log(chalk.bold(chalk.red(`Failed to refactor ${file}`)));
            return;
        }
        fs.writeFileSync(dest, newCode);
        console.log(chalk.bold(chalk.green(`Refactored ${file}`)));
    }
}

for (const file of args.path) {
    if (file === args.model) {
        console.log(`Skipping ${file} as it is the model file`);
        continue;
    }
    console.log(chalk.bold(chalk.blue(`Refactoring ${file}...`)));
    const code = fs.readFileSync(file).toString();
    const response = await refactor(code);
    handleResponse(response, file);
}
