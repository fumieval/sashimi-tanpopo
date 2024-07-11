import Anthropic from "@anthropic-ai/bedrock-sdk";
import OpenAI from "openai";

export interface Backend {
    ask(question: string): Promise<string>;
}

export class Claude implements Backend {
    private anthropic: Anthropic;
    constructor() {
        this.anthropic = new Anthropic({
            awsRegion: "us-east-1",
        });
    }
    async ask(question: string): Promise<string> {
        const msg = await this.anthropic.messages.create({
            model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
            max_tokens: 8192,
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
