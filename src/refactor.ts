import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

type Parameters = {
    before: string;
    after: string;
    description: string;
    source: string;
    notes: string[];
};

export async function refactor({
    before,
    after,
    description,
    source,
    notes,
}: Parameters): Promise<string> {
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

    const msg = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
    });

    return msg.content[0].text;
}
