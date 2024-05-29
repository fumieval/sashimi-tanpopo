import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface Backend {
    ask(question: string): Promise<string>;
}

export class Claude implements Backend {
    private anthropic: Anthropic;
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async ask(question: string): Promise<string> {
        const msg = await this.anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 4096,
            messages: [{ role: "user", content: question }],
        });

        return msg.content[0].text;
    }
}

export class ChatGPT implements Backend {
    private openai: OpenAI;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async ask(question: string): Promise<string> {
        const chatCompletion = await this.openai.chat.completions.create({
            messages: [{ role: "user", content: question }],
            model: "gpt-4o",
        });

        return chatCompletion.choices[0].message.content ?? "";
    }
}
