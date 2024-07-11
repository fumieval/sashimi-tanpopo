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
