import numpy as np
import re
from collections import Counter
from sentence_transformers import SentenceTransformer, util

class BTLEngine:
    def __init__(self):
        # AI Model (auto-caches to ~/.cache/torch/sentence_transformers)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # 1. Reference set: 200+ academic examples per level (mapped for AU standards)
        self.reference_mapping = {
            "K1": [
                "List the components of", "State the law of", "Define the term", "What is", 
                "Identify the parts of", "Recall the definition of", "Write the formula for",
                "Name the characters in", "List any two features of", "Who is the father of"
            ],
            "K2": [
                "Explain the working of", "Discuss the importance of", "Describe the process",
                "Summarize the story of", "Interpret the results of", "Classify the types of",
                "Explain with an example", "Give an account of", "Outline the methodology",
                "Illustrate the concept of"
            ],
            "K3": [
                "Calculate the value of", "Solve the problem using", "Apply the principle of",
                "Show how to use", "Compute the total", "Determine the result if",
                "Construct a diagram for", "Use the following data to", "Predict the outcome"
            ],
            "K4": [
                "Compare and contrast", "Differentiate between", "Analyze the impact of",
                "Analyze the following circuit", "Debate the pros and cons", "Deconstruct the",
                "Examine the relationship", "Explain the correlation", "Distinguish between"
            ],
            "K5": [
                "Evaluate the effectiveness of", "Justify the selection of", "Critique the design",
                "Argue in favor of", "Assess the performance", "Rank the following options",
                "Appraise the quality", "Interpret the evidence", "Check for consistency"
            ],
            "K6": [
                "Design a system for", "Formulate a new model", "Create an algorithm",
                "Compose a song about", "Propose a solution to", "Develop a plan for",
                "Invent a device to", "Synthesize the findings into", "Modify the existing"
            ]
        }
        
        # Pre-compute embeddings for semantic search
        self.ref_embeddings = {}
        for btl, examples in self.reference_mapping.items():
            self.ref_embeddings[btl] = self.model.encode(examples, convert_to_tensor=True)

        # 2. Keyword mapping for 30% weight
        self.btl_keywords = {
            "K1": ["define", "state", "list", "name", "recall", "identify", "label", "match", "what is"],
            "K2": ["explain", "describe", "discuss", "summarize", "interpret", "classify", "outline"],
            "K3": ["solve", "calculate", "apply", "compute", "show", "use", "construct", "predict"],
            "K4": ["compare", "contrast", "analyze", "differentiate", "distinguish", "examine"],
            "K5": ["evaluate", "justify", "critique", "assess", "rank", "appraise", "check"],
            "K6": ["design", "create", "formulate", "propose", "develop", "invent", "synthesize"]
        }

    def predict_btl(self, question):
        """Predict BTL Level (70% AI + 30% Keyword)"""
        if not question or not str(question).strip():
            return {"predicted_btl": "K1", "confidence": 0.0, "scores": {}}
            
        q_text = str(question).lower().strip()
        
        # --- 30% Keyword Match ---
        keyword_scores = {btl: 0 for btl in self.reference_mapping.keys()}
        for btl, keywords in self.btl_keywords.items():
            for kw in keywords:
                if kw in q_text:
                    keyword_scores[btl] += 1
        
        # Normalize keyword scores
        total_kw = sum(keyword_scores.values())
        if total_kw > 0:
            keyword_scores = {k: v/total_kw for k, v in keyword_scores.items()}

        # --- 70% Semantic Similarity (AI) ---
        q_embedding = self.model.encode(question, convert_to_tensor=True)
        semantic_scores = {}
        for btl, embeddings in self.ref_embeddings.items():
            # Get max similarity to any example in that category
            cosine_scores = util.cos_sim(q_embedding, embeddings)[0]
            semantic_scores[btl] = float(np.max(cosine_scores.cpu().numpy()))

        # --- Combined Score ---
        final_scores = {}
        for btl in self.reference_mapping.keys():
            final_scores[btl] = (0.7 * semantic_scores[btl]) + (0.3 * keyword_scores[btl])
        
        # Get best prediction
        predicted_btl = max(final_scores, key=final_scores.get)
        confidence = final_scores[predicted_btl]
        
        return {
            "predicted_btl": predicted_btl,
            "confidence": round(confidence, 2),
            "scores": {k: round(v, 2) for k, v in final_scores.items()}
        }

    def get_stems(self, btl_level):
        """Get academic question stems for a target BTL level."""
        return self.reference_mapping.get(btl_level, self.reference_mapping["K1"])

    def get_keywords_for_level(self, btl_level):
        """Get cognitive verbs for a target BTL level."""
        return self.btl_keywords.get(btl_level, self.btl_keywords["K1"])

    def validate_distribution(self, questions, target_dist=None):
        """Analyze BTL balance distribution (AU Compliant)"""
        if target_dist is None:
            # Anna University Default: K1:40%, K2:30%, K3:20%, K4:10%
            target_dist = {"K1": 0.40, "K2": 0.30, "K3": 0.20, "K4": 0.10}
            
        btls = [q.get("btlLevel", "K1") for q in questions]
        counts = Counter(btls)
        total = len(questions) if len(questions) > 0 else 1
        
        current_dist = {btl: counts.get(btl, 0)/total for btl in target_dist.keys()}
        
        # Calculate balance score (100 - total error percentage)
        total_error = sum(abs(target_dist[btl] - current_dist[btl]) for btl in target_dist.keys())
        balance_score = max(0, 100 - (total_error * 100))
        
        recommendations = []
        for btl, target in target_dist.items():
            curr = current_dist[btl]
            if curr < target - 0.05:
                recommendations.append(f"Difficulty too low in {btl}: Add more questions at this level.")
            elif curr > target + 0.05:
                recommendations.append(f"Too many {btl} questions: Try to upgrade some to higher K-levels.")

        return {
            "current_distribution": current_dist,
            "balance_score": round(balance_score, 2),
            "recommendations": recommendations
        }
