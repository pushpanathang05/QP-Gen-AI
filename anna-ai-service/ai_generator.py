import fitz  # PyMuPDF
import re
import random
import requests
import json
import traceback
from collections import defaultdict, Counter
from btl_engine import BTLEngine
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

class OllamaClient:
    def __init__(self, model="deepseek-r1:1.5b", base_url="http://localhost:11434"):
        self.enabled = False # Temporarily disabled to "generate PDF first" as per user request
        self.model = model
        self.base_url = f"{base_url}/api/generate"
        self.system_prompt = """
You are a highly professional University Professor and Exam Controller.
Your sole task is to generate high-quality, academic-standard examination questions based on provided topics, Bloom's Taxonomy levels (K1-K6), and marks.

### CORE RULES:
1. RESPONSE FORMAT: Output ONLY the question text. Do not include preamble, conversational filler, or intro phrases like "Here is your question".
2. MARKS CONSISTENCY: Substantial marks (10+) MUST require scenario-based analysis or detailed examples.
"""

    def generate_question(self, topic, btl_level, marks):
        if not self.enabled: return None
        try:
            prompt = f"Generate a {marks}-mark question on the topic '{topic}' at Bloom's Taxonomy Level {btl_level}. Ensure it is academically rigorous and suitable for a University Degree Examination."
            
            payload = {
                "model": self.model,
                "prompt": f"{self.system_prompt}\n\nUser: {prompt}",
                "stream": False,
                "options": {"temperature": 0.7}
            }
            
            response = requests.post(self.base_url, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            full_text = result.get("response", "")
            
            # DeepSeek-R1 specific: remove <think> blocks if present
            clean_text = re.sub(r'<think>.*?</think>', '', full_text, flags=re.DOTALL).strip()
            return clean_text
        except Exception as e:
            print(f"Ollama Error: {e}")
            return None

class GeminiClient:
    def __init__(self, api_key=None, model_name="gemini-1.5-pro"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(model_name)
            self.enabled = True
        else:
            self.enabled = False
            print("Gemini API Key missing. GeminiClient disabled.")

    def generate_questions_batch(self, sub, unit, marks, btl, count):
        if not self.enabled: return None
        
        prompt = f"""You are an expert Anna University question paper setter with deep knowledge of Bloom’s Taxonomy.

Generate a high-quality university question paper based on the following inputs:

Subject: {sub}
Unit: {unit}
Marks per question: {marks}
BTL Level: {btl}
Number of questions: {count}

Strict Requirements:
- Generate EXACTLY {count} questions
- Each question must strictly match {marks} marks standard
- Questions must strictly follow Bloom’s Taxonomy Level {btl}
- Avoid simple definitions or recall-based questions unless BTL is 1 or 2
- Ensure questions are analytical, application-based, or problem-solving (if BTL >= 3)
- Cover different important concepts from the given unit
- Do NOT repeat concepts or concepts/questions
- Maintain Anna University exam style and difficulty level
- Use clear, formal, academic language

Quality Constraints:
- Questions must be suitable for university semester exams
- Avoid vague or generic questions
- Prefer scenario-based or practical-oriented questions where applicable
- Ensure proper verb usage based on BTL (e.g., Analyze, Design, Evaluate, Compare)

Strict Output Format (MUST FOLLOW):
Q1. <question>
Q2. <question>
Q3. <question>
Q4. <question>
Q5. <question>

Rules:
- Do NOT include answers
- Do NOT include explanations
- Do NOT include headings or extra text
- Output ONLY the questions"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            # Parse Q1. Q2. etc. into a list
            questions = re.findall(r'Q\d+\.\s*(.*?)(?=Q\d+\.|$)', text, re.DOTALL)
            return [q.strip() for q in questions]
        except Exception as e:
            print(f"Gemini Error: {e}")
            return None

    def generate_single_question(self, topic, btl_level, marks):
        if not self.enabled: return None
        
        prompt = f"Generate a {marks}-mark university exam question on the topic '{topic}' at Bloom's Taxonomy Level {btl_level}. Output ONLY the question text."
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini Error: {e}")
            return None

class AUQuestionGenerator:
    def __init__(self):
        self.btl_engine = BTLEngine()
        self.ollama = OllamaClient()
        self.gemini = GeminiClient()
        self.stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 
                          'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 
                          'its', 'look', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who'}

    def extract_syllabus(self, pdf_path):
        """Extracts UNIT I to UNIT V content with strict isolation."""
        doc = fitz.open(pdf_path)
        content = ""
        for page in doc:
            content += page.get_text()
        doc.close()

        # Sanitize whitespace
        content = re.sub(r'\s+', ' ', content)

        units = {}
        # Resilient Unit Patterns (Support I, 1, etc.)
        patterns = [
            (r'UNIT\s+(?:I|1)\b(.*?)(?=UNIT\s+(?:II|2)\b|LIST\s+OF|REFERENCES|$)', 'UNIT I'),
            (r'UNIT\s+(?:II|2)\b(.*?)(?=UNIT\s+(?:III|3)\b|LIST\s+OF|REFERENCES|$)', 'UNIT II'),
            (r'UNIT\s+(?:III|3)\b(.*?)(?=UNIT\s+(?:IV|4)\b|LIST\s+OF|REFERENCES|$)', 'UNIT III'),
            (r'UNIT\s+(?:IV|4)\b(.*?)(?=UNIT\s+(?:V|5)\b|LIST\s+OF|REFERENCES|$)', 'UNIT IV'),
            (r'UNIT\s+(?:V|5)\b(.*?)(?=LIST\s+OF|REFERENCES|$)', 'UNIT V'),
        ]

        for pattern, unit_name in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                units[unit_name] = match.group(1).strip()
            else:
                print(f"Warning: Missing data for {unit_name}")
                units[unit_name] = ""

        return units

    def extract_concepts(self, text, limit=12):
        """Extract important technical concepts (including bi-grams)."""
        # 1. Extract potential technical bigrams (e.g., "Signal Processing")
        bigrams = re.findall(r'\b([A-Z][a-z]{3,}|[a-z]{4,})\s+([A-Z][a-z]{3,}|[a-z]{4,})\b', text)
        bigram_list = [f"{a} {b}" for a, b in bigrams if a.lower() not in self.stop_words and b.lower() not in self.stop_words]
        
        # 2. Extract single keywords
        words = re.findall(r'\b[a-z]{5,20}\b', text.lower())
        filtered_words = [w for w in words if w not in self.stop_words]
        
        counts = Counter(bigram_list + filtered_words)
        return [concept for concept, count in counts.most_common(limit)]

    def generate_questions(self, units):
        """Generates Part A and Part B questions with Targeted BTL Quotas."""
        part_a = []
        part_b = []

        # Target Distribution for AU Papers:
        # Part A (10 Qs): ~60% K1/K2, ~40% K3
        # Part B (5 Qs): ~60% K3/K4, ~40% K5/K6 (Choice a/b)
        
        target_a = ["K1", "K1", "K2", "K2", "K1", "K2", "K3", "K2", "K1", "K3"]
        target_b = [
            {"a": "K3", "b": "K3"}, # Unit 1
            {"a": "K4", "b": "K4"}, # Unit 2
            {"a": "K3", "b": "K4"}, # Unit 3
            {"a": "K5", "b": "K5"}, # Unit 4
            {"a": "K6", "b": "K4"}  # Unit 5
        ]

        unit_names = list(units.keys())
        
        # 1. Generate Part A (2 per unit)
        for i, unit_name in enumerate(unit_names):
            concepts = self.extract_concepts(units[unit_name], limit=8)
            if not concepts: concepts = ["Fundamental Concept"]

            for j in range(2):
                q_idx = (i * 2) + j
                target_btl = target_a[q_idx] if q_idx < len(target_a) else "K2"
                topic = random.choice(concepts)
                
                # Attempt DeepSeek Reasoning
                q_text = self.ollama.generate_question(topic, target_btl, 2)
                
                # Fallback to Template
                if not q_text:
                    stem = random.choice(self.btl_engine.get_stems(target_btl))
                    q_text = f"{stem} {topic}."

                part_a.append({
                    "id": f"Q{len(part_a)+1}",
                    "text": q_text,
                    "btl": target_btl,
                    "confidence": 0.95 if "ollama" in locals() else 0.7,
                    "marks": 2
                })

        # 2. Generate Part B (Choice a or b per unit)
        for i, unit_name in enumerate(unit_names):
            concepts = self.extract_concepts(units[unit_name], limit=10)
            if not concepts: concepts = ["Advanced Professional Topic"]

            unit_b = []
            targets = target_b[i] if i < len(target_b) else {"a": "K3", "b": "K3"}
            
            for choice in ['a', 'b']:
                target_btl = targets[choice]
                topic = random.choice(concepts)
                
                # Attempt DeepSeek Reasoning
                q_text = self.ollama.generate_question(topic, target_btl, 13)
                
                # Fallback to Template
                if not q_text:
                    stem = random.choice(self.btl_engine.get_stems(target_btl))
                    q_text = f"{stem} {topic} in detail with suitable diagrams."

                unit_b.append({
                    "choice": choice,
                    "text": q_text,
                    "btl": target_btl,
                    "confidence": 0.98,
                    "marks": 13
                })
            
            part_b.append({
                "unit": unit_name,
                "questions": unit_b
            })

        return {"part_a": part_a[:10], "part_b": part_b[:5]}

    def generate_single_question(self, topic, unit="UNIT I", btl_level="K2", marks=2):
        """Generates a single question with LLM Reasoning."""
        topic = topic or "Fundamental Concept"
        
        # Try Gemini first if enabled, then Ollama, then Template
        q_text = None
        if self.gemini.enabled:
            q_text = self.gemini.generate_single_question(topic, btl_level, marks)
        
        if not q_text and self.ollama.enabled:
            q_text = self.ollama.generate_question(topic, btl_level, marks)
        
        if not q_text:
            stem = random.choice(self.btl_engine.get_stems(btl_level))
            q_text = f"{stem} {topic}."

        return {
            "questionText": q_text,
            "btlLevel": btl_level,
            "unit": unit,
            "marks": marks
        }
