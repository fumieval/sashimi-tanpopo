import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export interface Backend {
    ask(question: string): Promise<string>;
}

export class Claude implements Backend {
    private anthropic: Anthropic;
    constructor(bedrock: boolean) {
        this.anthropic = bedrock
            ? new AnthropicBedrock({
                  awsRegion: "us-east-1",
              })
            : new Anthropic({
                  apiKey: process.env.ANTHROPIC_API_KEY,
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
