import axios from 'axios';

async function checkOllama() {
    try {
        const response = await axios.get('http://localhost:11434/api/tags');
        console.log('Ollama is running. Available models:', JSON.stringify(response.data.models.map(m => m.name)));
    } catch (err) {
        console.error('Ollama is NOT reachable at http://localhost:11434/api/tags');
        console.error('Error:', err.message);
    }
}

checkOllama();
