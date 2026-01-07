export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const sendMessageToGemma = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  model: string = 'llama3.2:1b'
) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}. Is Ollama running?`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            const content = json.message.content;
            assistantMessage += content;
            onChunk(content);
          }
          if (json.done) break;
        } catch (e) {
          console.error('Error parsing JSON chunk', e);
        }
      }
    }

    return assistantMessage;
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
};
