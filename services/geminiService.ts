
import { GoogleGenAI } from "@google/genai";
import { configService } from "./configService";

let ai: GoogleGenAI | null = null;
let isInitializing = false;
let initializationPromise: Promise<GoogleGenAI | null> | null = null;

const initializeAiClient = async (): Promise<GoogleGenAI | null> => {
    if (ai) {
        return ai;
    }
    
    if (isInitializing && initializationPromise) {
        return initializationPromise;
    }

    isInitializing = true;
    initializationPromise = (async () => {
        try {
            const config = await configService.getConfig();
            const API_KEY = config?.geminiApiKey;

            if (API_KEY) {
                ai = new GoogleGenAI({ apiKey: API_KEY });
                return ai;
            }
            
            console.warn("API_KEY for Gemini was not fetched from config. AI features will not work.");
            return null;
        } catch (error) {
            console.error("Failed to initialize Gemini client:", error);
            return null;
        } finally {
            isInitializing = false;
        }
    })();
    
    return initializationPromise;
};

export async function* generateDecorationIdeasStream(theme: string, items: string, skill: string, time: string): AsyncGenerator<string> {
    const aiClient = await initializeAiClient();
    if (!aiClient) {
        yield "AI service is not configured. Please contact support.";
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
