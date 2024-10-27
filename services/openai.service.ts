import 'dotenv/config';
import OpenAI from 'openai';
import { createMessage, getAllMessages } from '../models/message.model';
import { searchIndex } from './embedder.service';
const openai = new OpenAI();
const instructions =
    "You are a customer support assistant for TechEase Solutions, a company that provides comprehensive IT services to businesses. Your role is to assist our clients with their technical issues, answer questions about our services, and provide guidance on using our products effectively. Always respond in a friendly, professional manner, and ensure your explanations are clear and concise. If you're unable to resolve an issue immediately, reassure the customer that you will escalate the problem and follow up promptly. Your goal is to provide exceptional support and ensure customer satisfaction.";
const systemInstruction = {
    role: 'system',
    content: instructions,
};

export async function sendMessage(threadId: string, content: { text: string; url?: string }) {
    console.log('sendMessage', threadId, JSON.stringify(content));

    // 2. Load history of messages from the database
    const dbMessages = await getAllMessages(threadId);

    // 1. Add user message to the database
    await createMessage({
        thread_id: threadId,
        role: 'user',
        content: content.text,
        url: content.url || null,
    });

    // 3. Prepare messages for OpenAI
    const historyMessages = dbMessages.map(message => ({
        role: message.role,
        content: message.content,
    }));

    // 4. Get relevant documents from vector database
    const query = content.text;
    const embeddingResult = await embed(query);
    const vector = embeddingResult[0].embedding;

    const matches = (await searchIndex(vector)).matches.filter(match => match.score > 0.4);
    let text = query;
    if (matches.length) {
        console.log('Found matches:', matches.length);
        const context = matches.map(match => match.metadata.content).join('\n\n');
        text = `Use the following information to answer the question.\n\nContext:\n${context}\n\nQuestion:\n${query}\n\nAnswer:`;
    } else {
        console.log('No matches found');
    }
    historyMessages.push({
        role: 'user',
        content: text,
    });
    const messages: any[] = [systemInstruction, ...historyMessages];

    // 4. Send messages to OpenAI
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
    });

    const message = completion.choices[0].message;
    console.log('Response:', message);

    // 5. Add assistant message to the database
    await createMessage({
        thread_id: threadId,
        role: 'assistant',
        content: message.content,
    });

    return { content: message.content };
}

export async function embed(input: string) {
    const response = await openai.embeddings.create({
        input,
        model: 'text-embedding-3-small',
    });

    return response.data;
}
