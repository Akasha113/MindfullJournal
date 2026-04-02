from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import joblib
import os
from datetime import datetime

### MODEL CLASSES ###
class SuicideAnalysisRequest(BaseModel):
    text: str
    conversation_id: str = None
    user_id: str = None
    context_messages: List[Dict[str, Any]] = []

class RiskAnalysisResponse(BaseModel):
    risk_level: str
    confidence: float
    risk_factors: List[str]
    contextual_cues: List[str]
    mcp_classification: bool
    recommended_action: str
    flagged: bool
    knowledge_base_matches: List[str]

### SIMPLIFIED SUICIDE DETECTION ###
class SimplifiedSuicideDetectionRAG:
    def __init__(self):
        print("Initializing Simplified Suicide Detection RAG System")
        self.load_mcp_model()
        self.load_suicide_patterns()

    def load_suicide_patterns(self):
        """Load suicide detection patterns (English + Urdu)"""
        self.direct_patterns = [
            # English
            'i want to kill myself', 'i am going to kill myself', 'i plan to end my life',
            'i am going to commit suicide', 'i have decided to die', 'i will take my own life',
            'tonight is my last night', 'i have a plan to', 'i already have the', 'i know how i will do it',
            # Urdu
            'khudkushi karna chahti hoon', 'khudkushi karna chahta hoon', 'khudlushi karna chahti hoon', 'khudlushi karna chahta hoon',
            'khudkushi krna chahti hoon', 'khudkushi krna chahta hoon', 'khudlushi krna chahti hoon', 'khudlushi krna chahta hoon',
            'jaan lena chahti hoon', 'jaan lena chahta hoon', 'jaan laina chahti hoon', 'jaan laina chahta hoon',
            'jaan lena chahti hon', 'jaan lena chahta hon', 'jaan laina chahti hon', 'jaan laina chahta hon',
            'marna chahti hoon', 'marna chahta hoon', 'marna chahti hon', 'marna chahta hon',
            'zindagi khatam karna chahti hoon', 'zindagi khatam karna chahta hoon', 'zindagi khatam krna chahti hoon', 'zindagi khatam krna chahta hoon',
            'khud ko maarna chahti hoon', 'khud ko maarna chahta hoon', 'khud ko marna chahti hoon', 'khud ko marna chahta hoon',
            'khud ko khatam karna chahti hoon', 'khud ko khatam karna chahta hoon', 'khud ko khatam krna chahti hoon', 'khud ko khatam krna chahta hoon',
            'khud ko khatam krna chahti hon', 'khud ko khatam krna chahta hon', 'aaj raat meri aakhri raat hai', 'aaj raat meri aakhri raat',
            'kal mera aakhri din hai', 'kal mera aakhri din', 'main marne ka faisla kar chuki hoon', 'main marne ka faisla kar chuka hoon',
            'main marne ka faisla kr chuki hoon', 'main marne ka faisla kr chuka hoon', 'main khudkushi karne wali hoon', 'main khudkushi karne wala hoon',
            'main khudlushi karne wali hoon', 'main khudlushi karne wala hoon', 'main khudkushi krne wali hoon', 'main khudkushi krne wala hoon',
            'main khudlushi krne wali hoon', 'main khudlushi krne wala hoon'
        ]
        
        self.indirect_patterns = [
            # English
            'i can\'t go on anymore', 'there\'s no point in living', 'everyone would be better without me',
            'i feel like giving up', 'life is too hard', 'i don\'t see a way out',
            'i feel trapped', 'nothing will ever get better', 'i am a burden to everyone',
            'i just want the pain to stop', 'hopeless', 'worthless', 'empty', 'numb',
            # Urdu
            'zindagi se tang aa gayi hoon', 'zindagi se tang aa gaya hoon', 'zindagi ka koi matlab nahi',
            'sab log bina mere behtar honge', 'main haar maan gayi hoon', 'main haar maan gaya hoon',
            'zindagi bahut mushkil hai', 'koi raasta nahi dikhta', 'main phas gayi hoon', 'main phas gaya hoon',
            'sab kuch khatam kar doon', 'zindagi se nikalna chahti hoon', 'zindagi se nikalna chahta hoon',
            'dard khatam karna chahti hoon', 'dard khatam karna chahta hoon', 'be umeed', 'bekar', 'khali',
            'sunn', 'laachaar', 'bebas', 'dukhi', 'pareshan', 'ghamgin', 'udass'
        ]
        
        self.method_patterns = [
            # English
            'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
            'hanging', 'jumping', 'drowning', 'cutting', 'poison',
            # Urdu
            'goli', 'rassee', 'pul', 'bandook', 'chaku', 'dawai',
            'latakna', 'koodna', 'dubna', 'kaatna', 'zehar', 'dawai ki over dose',
            'khud ko kaatna', 'khud ko jalan'
        ]
        
        # More specific temporal patterns combined with concerning context (English + Urdu)
        self.temporal_patterns = [
            # English
            'tonight is my last', 'today i will end', 'tomorrow i plan to', 'this weekend i will',
            'when i get home tonight', 'after this conversation', 'in the morning i will end',
            'by tonight', 'before tomorrow', 'very soon i will',
            # Urdu
            'aaj raat aakhri', 'aaj khatam kar doon', 'kal karne ka plan', 'is hafte kar doon',
            'jab ghar pahunchun', 'iske baad', 'subah khatam kar doon', 'raaat tak', 'kal se pehle',
            'bahut jaldi kar doon', 'abhi karna hai', 'turant karna hai'
        ]

    def load_mcp_model(self):
        """Load the Machine Learning Classification Pipeline model"""
        try:
            mcp_path = "../MCP/"
            self.mcp_vectorizer = joblib.load(os.path.join(mcp_path, "vectorizer.joblib"))
            self.mcp_model = joblib.load(os.path.join(mcp_path, "logreg_model.joblib"))
            print("MCP model loaded successfully")
        except Exception as e:
            print(f"Warning: Could not load MCP model: {e}")
            self.mcp_vectorizer = None
            self.mcp_model = None

    def mcp_classify(self, text):
        """Use Machine Learning Classification Pipeline for suicide detection"""
        if not self.mcp_vectorizer or not self.mcp_model:
            print("MCP model or vectorizer not loaded. Defaulting to no risk.")
            return False, 0.0
        try:
            X = self.mcp_vectorizer.transform([text])
            prediction = self.mcp_model.predict(X)[0]
            probability = self.mcp_model.predict_proba(X)[0]
            confidence = max(probability)
            return bool(prediction), confidence
        except Exception as e:
            print(f"MCP classification error for input {text!r}: {e}")
            # Default to no risk if MCP fails for any reason
            return False, 0.0

    def analyze_patterns(self, text):
        """Analyze text for suicide patterns"""
        text_lower = text.lower()
        risk_score = 0
        risk_factors = []
        
        # Direct patterns (highest weight)
        for pattern in self.direct_patterns:
            if pattern in text_lower:
                risk_score += 10
                risk_factors.append(f"Direct threat: {pattern}")
        
        # Indirect patterns
        for pattern in self.indirect_patterns:
            if pattern in text_lower:
                risk_score += 6
                risk_factors.append(f"Indirect indicator: {pattern}")
        
        # Method patterns
        for pattern in self.method_patterns:
            if pattern in text_lower:
                risk_score += 8
                risk_factors.append(f"Method reference: {pattern}")
        
        # Temporal patterns
        for pattern in self.temporal_patterns:
            if pattern in text_lower:
                risk_score += 7
                risk_factors.append(f"Temporal indicator: {pattern}")
        
        return risk_score, risk_factors

    def analyze_context(self, messages):
        """Analyze conversation context"""
        if not messages:
            return 0, []
        
        recent_messages = messages[-5:]  # Last 5 messages
        user_messages = [msg for msg in recent_messages if msg.get("role") == "user"]
        
        risk_words = [
            # English
            "die", "kill", "suicide", "end", "pain", "hopeless", "trapped", "burden",
            # Urdu
            "marna", "maar", "khudkushi", "khatam", "dard", "be umeed", "phas", "bojh",
            "jaan lena", "zindagi khatam", "khud ko maarna", "zehar", "kaatna", "jaland"
        ]
        context_score = 0
        contextual_cues = []
        
        for i, msg in enumerate(user_messages):
            content = msg.get("content", "").lower()
            word_count = sum(1 for word in risk_words if word in content)
            if word_count > 0:
                weight = (i + 1) / len(user_messages)  # More recent messages get higher weight
                context_score += word_count * weight
                contextual_cues.append(f"Risk words in message {i+1}: {word_count}")
        
        if context_score > 2 and len(user_messages) >= 2:
            contextual_cues.append("Escalating pattern detected")
            context_score += 3
        
        return context_score, contextual_cues

    def determine_risk_level(self, pattern_score, context_score, mcp_positive, mcp_confidence):
        """Determine overall risk level with improved filter logic and MCP safeguard"""
        total_score = pattern_score + context_score

        # Give more weight to MCP positive and confidence, but only if patterns/context are present
        if mcp_positive and (pattern_score > 0 or context_score > 0):
            total_score += mcp_confidence * 8

        # Only allow MCP to trigger critical if confidence is extremely high AND patterns/context are present
        if mcp_positive and (pattern_score >= 10 or total_score >= 20 or (pattern_score > 0 and mcp_confidence > 0.95)):
            return "critical"
        elif total_score >= 15 or (mcp_positive and (pattern_score >= 6 or (pattern_score > 0 and mcp_confidence > 0.8))):
            return "high"
        elif total_score >= 8 or (mcp_positive and (pattern_score >= 3 or (pattern_score > 0 and mcp_confidence > 0.6))):
            return "medium"
        else:
            return "low"

    def get_recommended_action(self, risk_level):
        """Get recommended intervention action"""
        actions = {
            "critical": "IMMEDIATE EMERGENCY INTERVENTION: Contact 911 or crisis hotline (988) immediately. Do not leave person alone.",
            "high": "URGENT PROFESSIONAL INTERVENTION: Contact mental health crisis team. Implement safety planning.",
            "medium": "PROFESSIONAL CONSULTATION: Schedule mental health assessment within 24-48 hours.",
            "low": "SUPPORTIVE MONITORING: Continue therapeutic conversation. Provide resources if appropriate."
        }
        return actions.get(risk_level, "Continue monitoring")

    def get_knowledge_matches(self, risk_level):
        """Get relevant knowledge base information (English + Urdu)"""
        if risk_level == "critical":
            return [
                # English
                "Crisis Resources: National Suicide Prevention Lifeline (988)",
                "Immediate Action: Contact emergency services",
                "Safety Protocol: Do not leave person alone",
                # Urdu
                "کرائسس وسائل: قومی خودکشی روک تھام لائف لائن (988)",
                "فوری کارروائی: ایمرجنسی سروسز سے رابطہ کریں",
                "سیفٹی پروٹوکول: شخص کو اکیلا نہ چھوڑیں"
            ]
        elif risk_level == "high":
            return [
                # English
                "Warning Signs: Expressions of hopelessness and specific plans",
                "Intervention: Professional mental health assessment needed",
                "Resources: Crisis text line (text HOME to 741741)",
                # Urdu
                "خطرے کے نشان: ناامیدی کے اظہار اور مخصوص منصوبے",
                "مداخلت: پیشہ ورانہ ذہنی صحت کی تشخیص کی ضرورت",
                "وسائل: کرائسس ٹیکسٹ لائن (HOME لکھ کر 741741 پر ٹیکسٹ کریں)"
            ]
        elif risk_level == "medium":
            return [
                # English
                "Risk Factors: Emotional distress and concerning language",
                "Prevention: Supportive conversation and resource provision",
                # Urdu
                "خطرے کے عوامل: جذباتی پریشانی اور تشویش ناک زبان",
                "روک تھام: معاونت بخش گفتگو اور وسائل کی فراہمی"
            ]
        else:
            return [
                # English
                "Preventive Resources: Mental health support information",
                # Urdu
                "روک تھام وسائل: ذہنی صحت کی سپورٹ معلومات"
            ]

    def analyze_suicide_risk(self, request: SuicideAnalysisRequest) -> RiskAnalysisResponse:
        """Comprehensive suicide risk analysis"""
        print(f"Analyzing suicide risk for text: {request.text[:100]}...")
        
        # Pattern analysis
        pattern_score, risk_factors = self.analyze_patterns(request.text)
        
        # Context analysis
        context_score, contextual_cues = self.analyze_context(request.context_messages)
        
        # MCP classification
        mcp_positive, mcp_confidence = self.mcp_classify(request.text)
        
        # Determine risk level
        risk_level = self.determine_risk_level(pattern_score, context_score, mcp_positive, mcp_confidence)
        
        # Calculate confidence
        total_score = pattern_score + context_score
        confidence = min((total_score / 20) * 0.7 + (mcp_confidence * 0.3), 1.0)
        
        # Get recommendations and knowledge
        recommended_action = self.get_recommended_action(risk_level)
        knowledge_matches = self.get_knowledge_matches(risk_level)
        
        # Log high-risk cases
        if risk_level in ["high", "critical"]:
            self.log_high_risk_case(request, risk_level)
        
        return RiskAnalysisResponse(
            risk_level=risk_level,
            confidence=confidence,
            risk_factors=risk_factors,
            contextual_cues=contextual_cues,
            mcp_classification=mcp_positive,
            recommended_action=recommended_action,
            flagged=risk_level != "low",
            knowledge_base_matches=knowledge_matches
        )

    def log_high_risk_case(self, request, risk_level):
        """Log high-risk cases for admin review"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": request.user_id,
            "conversation_id": request.conversation_id,
            "message_content": request.text,
            "risk_level": risk_level,
            "requires_immediate_attention": risk_level == "critical"
        }
        print(f"HIGH RISK CASE LOGGED: {json.dumps(log_entry, indent=2)}")

### FASTAPI APP ###

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Simplified Suicide Detection RAG API")

# Enable CORS for all origins (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the RAG system
rag_system = SimplifiedSuicideDetectionRAG()

@app.post("/analyze_suicide_risk", response_model=RiskAnalysisResponse)
def analyze_suicide_risk(request: SuicideAnalysisRequest):
    """Analyze text for suicide risk using simplified RAG system"""
    try:
        return rag_system.analyze_suicide_risk(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mcp_model_loaded": rag_system.mcp_model is not None,
        "patterns_loaded": len(rag_system.direct_patterns) > 0
    }

@app.get("/")
def root():
    return {"message": "Simplified Suicide Detection RAG API. Use /analyze_suicide_risk for analysis."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("simplified_suicide_detection_api:app", host="0.0.0.0", port=8002, reload=True)
