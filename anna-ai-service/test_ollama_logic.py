import requests
import json
import re

def test_ollama():
    print("Testing connection to Ollama (http://localhost:11434)...")
    url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": "deepseek-r1:1.5b",
        "prompt": "Say 'Ollama is connected and ready for reasoning.'",
        "stream": False,
        "options": {"temperature": 0.1}
    }
    
    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        result = response.json()
        full_text = result.get("response", "")
        
        # Remove <think> blocks
        clean_text = re.sub(r'<think>.*?</think>', '', full_text, flags=re.DOTALL).strip()
        
        print(f"Success! Response: {clean_text}")
        return True
    except Exception as e:
        print(f"FAILED to connect to Ollama: {e}")
        print("\nEnsure Ollama is running and you have run: ollama pull deepseek-r1:1.5b")
        return False

if __name__ == "__main__":
    test_ollama()
