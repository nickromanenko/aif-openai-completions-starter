import 'dotenv/config';
import OpenAI from 'openai';
import { createMessage, getAllMessages } from '../models/message.model';
const openai = new OpenAI();
const instructions =
    "You are a customer support assistant for TechEase Solutions, a company that provides comprehensive IT services to businesses. Your role is to assist our clients with their technical issues, answer questions about our services, and provide guidance on using our products effectively. Always respond in a friendly, professional manner, and ensure your explanations are clear and concise. If you're unable to resolve an issue immediately, reassure the customer that you will escalate the problem and follow up promptly. Your goal is to provide exceptional support and ensure customer satisfaction.";
const systemInstruction = {
    role: 'system',
    content: instructions,
};

export async function sendMessage(threadId: string, content: { text: string; url?: string }) {
    console.log('sendMessage', threadId, JSON.stringify(content));

    // 1. Add user message to the database
    await createMessage({
        thread_id: threadId,
        role: 'user',
        content: content.text,
        url: content.url || null,
    });

    // 2. Load history of messages from the database
    const dbMessages = await getAllMessages(threadId);

    // 3. Prepare messages for OpenAI
    const historyMessages = dbMessages.map(message => ({
        role: message.role,
        content: message.content,
    }));

    const messages: any[] = [systemInstruction, ...historyMessages];

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
    });

    const message = completion.choices[0].message;
    console.log('Response:', message);

    // 4. Add assistant message to the database
    await createMessage({
        thread_id: threadId,
        role: 'assistant',
        content: message.content,
    });

    return { content: message.content };
}
