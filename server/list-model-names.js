import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Model Names:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (err) {
        console.error("Error listing models:", err.message);
    }
}

listModels();
