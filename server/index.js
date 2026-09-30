import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'My Future backend is running.' });
});

app.post('/api/chat', async (req, res) => {
  const { message = '', imageBase64 = '', imageType = 'image/png', messages = [] } = req.body || {};

  const lastMessage = typeof message === 'string' ? message : '';
  const incomingMessages = Array.isArray(messages) ? messages : [];

  if (!lastMessage.trim() && !imageBase64 && incomingMessages.length === 0) {
    return res.status(400).json({ error: 'No message provided.' });
  }

  if (!openai) {
    return res.json({
      reply: `Demo mode is active. You said: "${lastMessage || 'image upload'}". Add your OpenAI API key to .env to enable full AI responses.`,
    });
  }

  try {
    const formattedMessages = [
      {
        role: 'system',
        content: 'You are a helpful multimodal AI assistant that can answer questions by text or by analyzing images.',
      },
      ...incomingMessages.map((item) => {
        const content = item.content;
        if (typeof content === 'string') {
          return { role: item.role, content };
        }

        return {
          role: item.role,
          content: content.map((part) =>
            part.type === 'text'
              ? { type: 'text', text: part.text }
              : { type: 'image_url', image_url: { url: part.image_url.url } }
          ),
        };
      }),
    ];

    const userMessage = lastMessage.trim() || 'Please describe this image.';
    const finalContent = [];

    if (userMessage) {
      finalContent.push({ type: 'text', text: userMessage });
    }

    if (imageBase64) {
      finalContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${imageType};base64,${imageBase64}`,
        },
      });
    }

    formattedMessages.push({ role: 'user', content: finalContent.length ? finalContent : 'Hello!' });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content || 'I could not generate a response.';

    res.json({ reply });
  } catch (error) {
    console.error('OpenAI request failed:', error);
    res.status(500).json({
      error: 'AI request failed.',
      reply: 'The AI service is unavailable right now. Please try again in a moment.',
    });
  }
});

app.listen(port, () => {
  console.log(`My Future server running on http://localhost:${port}`);
});
