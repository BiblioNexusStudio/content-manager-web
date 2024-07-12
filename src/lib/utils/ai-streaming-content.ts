interface AiResponse {
    choices?: { delta: { content: string }; finish_reason: string | null }[];
    error?: { message: string };
}

export async function streamAiContent(response: Response, callback: (text: string) => void) {
    const decoder = new TextDecoder('utf-8');
    let incompleteResult = '';

    const reader = response.body!.getReader();

    // eslint-disable-next-line
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedValue = decoder.decode(value, { stream: true });
        const results = (incompleteResult + decodedValue).split('data: ');
        incompleteResult = '';

        for (let i = 0; i < results.length; i++) {
            const result = results[i]?.trim();
            if (!result || result === '[DONE]') continue;

            if (i === results.length - 1 && !decodedValue.endsWith('data: ')) {
                incompleteResult = result;
                break;
            }

            let json: AiResponse | undefined;

            try {
                json = JSON.parse(result) as AiResponse;
            } catch (e) {
                if (i === results.length - 1) {
                    incompleteResult = result;
                }
            }

            if (json) {
                if (json.error) {
                    throw new Error(json.error.message);
                } else if (json.choices) {
                    const content = json.choices[0]?.delta?.content;
                    if (content) {
                        callback(content);
                    }
                }
            }
        }
    }
}
