import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../constants";

let ai: GoogleGenAI | null = null;
let isInitialized = false;

const initializeAiClient = (): GoogleGenAI | null => {
    if (isInitialized) {
        return ai;
    }
    isInitialized = true;
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.warn("Gemini API Key is not configured in constants.ts. AI features will not work.");
        return null;
    }

    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        return ai;
    } catch (error) {
        console.error("Failed to initialize Gemini client:", error);
        return null;
    }
};

export async function* generateDecorationIdeasStream(theme: string, items: string, skill: string, time: string): AsyncGenerator<string> {
    const aiClient = initializeAiClient();
    if (!aiClient) {
        yield "AI service is not configured. Please check your API key in constants.ts.";
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