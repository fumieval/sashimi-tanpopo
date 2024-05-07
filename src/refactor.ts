import { Backend } from "./backend.js";

type Parameters = {
    before: string;
    after: string;
    description: string;
    source: string;
    notes: string[];
};

export async function refactor(
    { before, after, description, source, notes }: Parameters,
    backend: Backend,
): Promise<string> {
    const prompt = `We are trying to refactor some code.

Here's an example of the code before and after refactoring.

Before:

\`\`\`
${before}
\`\`\`

After:

\`\`\`
${after}
\`\`\`

Explanation:
${description}

Now, this is the code we are trying to refactor:

\`\`\`
${source}
\`\`\`

${notes.map((line: string) => `* ${line}`).join("\n")}`;
    return backend.ask(prompt);
}
