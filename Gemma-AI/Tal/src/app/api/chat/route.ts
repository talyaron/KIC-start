import { NextResponse } from 'next/server';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ollama.chat({
            model: 'gemma3n',
            messages: messages,
            stream: true,
          });

          for await (const part of response) {
            controller.enqueue(new TextEncoder().encode(part.message.content));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error interacting with Ollama:', error);
    return NextResponse.json({ error: 'Error interacting with AI' }, { status: 500 });
  }
}

