
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Lazily initialize the AI client to prevent app crash on load if API key is missing.
const getAiClient = (): GoogleGenAI | null => {
    if (ai) {
        return ai;
    }
    
    const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
        return ai;
    }
    
    console.warn("API_KEY for Gemini is not set or `process.env` is not available. AI features will not work.");
    return null;
}

export async function* generateDecorationIdeasStream(theme: string, items: string, skill: string, time: string): AsyncGenerator<string> {
    const aiClient = getAiClient();
    if (!aiClient) {
        yield "API Key not configured. Please set up your API_KEY environment variable.";
        return;
    }

    const prompt = `
        You are a helpful and creative assistant for the "Woon" app, which helps people celebrate special days.
        A user wants to create a decoration for "${theme}".

        Here are the details:
        - Household items available: "${items}"
        - User's skill level: "${skill}"
        - Time available: "${time}"

        Please provide 3 distinct, creative, and joyful decoration ideas. For each idea, provide a short, inspiring title and simple, step-by-step instructions. The tone should be encouraging and approachable. Format the output clearly.
    `;

    try {
        const response = await aiClient.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        for await (const chunk of response) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        yield "Sorry, I couldn't come up with ideas right now. Please try again later.";
    }
};