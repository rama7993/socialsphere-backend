import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

@Injectable()
export class AiService {
  constructor(private configService: ConfigService) {}

  async suggestCaption(imageBase64: string) {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image for a social media post. Provide 3 creative captions and relevant hashtags. Keep it engaging.',
            },
            { type: 'image', image: imageBase64 },
          ],
        },
      ],
    });

    return { suggestion: text };
  }

  async moderateContent(content: string) {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Analyze this content for toxicity. Respond with "SAFE" or "FLAGGED: [reason]". Content: "${content}"`,
    });

    return { status: text };
  }

  async getResponse(prompt: string) {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });
    return text;
  }
}
