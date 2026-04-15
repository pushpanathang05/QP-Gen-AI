import sys
import argparse
from ai_generator import GeminiClient

def main():
    parser = argparse.ArgumentParser(description="Gemini Question Generation CLI for Anna University Exam Papers")
    parser.add_argument("--sub", required=True, help="Subject Name")
    parser.add_argument("--unit", required=True, help="Unit Name (e.g., UNIT I)")
    parser.add_argument("--marks", type=int, default=2, help="Marks per question")
    parser.add_argument("--btl", default="K2", help="Bloom's Taxonomy Level (K1-K6)")
    parser.add_argument("--count", type=int, default=5, help="Number of questions to generate")
    
    args = parser.parse_args()
    
    client = GeminiClient()
    if not client.enabled:
        print("Error: Gemini API Key not found. Please set GEMINI_API_KEY in .env")
        sys.exit(1)
        
    print(f"\n--- Generating {args.count} questions for {args.sub} ({args.unit}) ---")
    print(f"--- BTL: {args.btl}, Marks: {args.marks} ---\n")
    
    questions = client.generate_questions_batch(
        sub=args.sub,
        unit=args.unit,
        marks=args.marks,
        btl=args.btl,
        count=args.count
    )
    
    if not questions:
        print("Failed to generate questions. Check logs above.")
        sys.exit(1)
        
    for i, q in enumerate(questions, 1):
        print(f"Q{i}. {q}")

if __name__ == "__main__":
    main()
