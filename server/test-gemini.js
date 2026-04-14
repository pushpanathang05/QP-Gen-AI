import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        console.log("Testing with model: gemini-1.5-pro");
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent("Say 'API Key is working'");
        console.log("Response:", result.response.text());
    } catch (err) {
        console.error("Error with gemini-1.5-pro:", err.message);

        try {
            console.log("Retrying with model: gemini-1.5-flash");
            const modelFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const resultFlash = await modelFlash.generateContent("Say 'Flash API Key is working'");
            console.log("Flash Response:", resultFlash.response.text());
        } catch (err2) {
            console.error("Error with gemini-1.5-flash:", err2.message);
        }
    }
}

test();
