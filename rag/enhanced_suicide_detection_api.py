from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import hnswlib
import numpy as np
from sentence_transformers import SentenceTransformer
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

class KnowledgeBaseDocument(BaseModel):
    title: str
    content: str
    category: str

### ENHANCED RAG FOR SUICIDE DETECTION ###
class SuicideDetectionRAG:
    def __init__(self):
        print("Initializing Suicide Detection RAG System")
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.knowledge_base = self.load_mental_health_knowledge()
        self.index = None
        self.passages = []
        self.mcp_vectorizer = None
        self.mcp_model = None
        self.load_mcp_model()
        self.build_knowledge_index()

    def load_mental_health_knowledge(self):
        """Load comprehensive mental health and suicide prevention knowledge base"""
        return [
            {
                "title": "Suicide Warning Signs",
                "content": "Talking about wanting to die or kill themselves. Looking for ways to kill themselves. Talking about feeling hopeless or having no reason to live. Talking about feeling trapped or in unbearable pain. Talking about being a burden to others. Increasing use of alcohol or drugs. Acting anxious or agitated. Withdrawing from family and friends. Changing eating and sleeping habits. Showing rage or talking about seeking revenge. Taking risks that could lead to death. Giving away prized possessions. Saying goodbye to loved ones.",
                "category": "warning_signs"
            },
            {
                "title": "Risk Factors for Suicide",
                "content": "Mental health conditions: Depression, bipolar disorder, schizophrenia, anxiety disorders, substance use disorders, eating disorders. Personal history: Previous suicide attempts, family history of suicide, childhood abuse or trauma. Environmental factors: Social isolation, bullying, discrimination, relationship problems, financial problems, job loss, access to lethal means.",
                "category": "risk_factors"
            },
            {
                "title": "Protective Factors",
                "content": "Strong connections to family and community support. Skills in problem solving and conflict resolution. Cultural and religious beliefs that discourage suicide. Easy access to effective mental health care. Restricted access to highly lethal means of suicide.",
                "category": "protective_factors"
            },
            {
                "title": "Crisis Intervention Phrases",
                "content": "I want to kill myself. I have a plan to end my life. I can't go on anymore. Everyone would be better off without me. I feel like giving up. There's no point in living. I want to disappear forever. I can't take this pain anymore. I'm thinking about suicide. Life isn't worth living.",
                "category": "crisis_phrases"
            },
            {
                "title": "Immediate Response Protocols",
                "content": "If someone expresses suicidal thoughts: Stay calm and listen without judgment. Take them seriously. Ask directly about suicidal thoughts and plans. Do not leave them alone. Remove or secure potential means of harm. Contact emergency services (911) or crisis hotline (988). Escort them to emergency room if necessary. Follow up to ensure they receive ongoing care.",
                "category": "intervention"
            },
            {
                "title": "Crisis Resources",
                "content": "National Suicide Prevention Lifeline: 988 or 1-800-273-8255. Crisis Text Line: Text HOME to 741741. International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/. National Alliance on Mental Illness (NAMI): 1-800-950-NAMI. Substance Abuse and Mental Health Services Administration (SAMHSA): 1-800-662-4357.",
                "category": "resources"
            },
            {
                "title": "Safety Planning Elements",
                "content": "Warning signs recognition: Personal signs that a crisis may be developing. Internal coping strategies: Things I can do to distract myself without contacting another person. Social contacts and social settings: People and places that provide distraction and support. Family members or friends who may help resolve a crisis. Mental health professionals and agencies to contact during a crisis. Making the environment safe: Removing or restricting access to lethal means.",
                "category": "safety_planning"
            }
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

    def build_knowledge_index(self):
        """Build HNSW index for mental health knowledge base"""
        print("Building knowledge base index")
        self.passages = []
        for doc in self.knowledge_base:
            # Split content into smaller passages for better retrieval
            content_passages = self.split_into_passages(doc["content"], max_length=300)
            for passage in content_passages:
                self.passages.append({
                    "text": passage,
                    "title": doc["title"],
                    "category": doc["category"]
                })

        # Create embeddings
        passage_texts = [p["text"] for p in self.passages]
        passage_embeddings = self.encoder.encode(passage_texts)
        
        # Build HNSW index
        dimension = passage_embeddings.shape[1]
        self.index = hnswlib.Index(space='cosine', dim=dimension)
        self.index.init_index(max_elements=len(self.passages), ef_construction=200, M=16)
        self.index.add_items(passage_embeddings, np.arange(len(self.passages)))
        print(f"Knowledge base index built with {len(self.passages)} passages")

    def split_into_passages(self, text, max_length=300):
        """Split text into overlapping passages"""
        words = text.split()
        passages = []
        for i in range(0, len(words), max_length//2):  # 50% overlap
            passage = " ".join(words[i:i+max_length])
            if len(passage.strip()) > 50:  # Only include substantial passages
                passages.append(passage)
        return passages

    def retrieve_relevant_knowledge(self, query, top_k=5):
        """Retrieve relevant knowledge base passages"""
        if not self.index:
            return []
        
        query_embedding = self.encoder.encode([query])
        indices, distances = self.index.knn_query(query_embedding, k=min(top_k, len(self.passages)))
        
        retrieved = []
        for idx, distance in zip(indices[0], distances[0]):
            passage = self.passages[idx]
            retrieved.append({
                "text": passage["text"],
                "title": passage["title"],
                "category": passage["category"],
                "relevance_score": 1 - distance  # Convert distance to similarity
            })
        
        return retrieved

    def mcp_classify(self, text):
        """Use Machine Learning Classification Pipeline for suicide detection"""
        if not self.mcp_vectorizer or not self.mcp_model:
            return False, 0.0
        
        try:
            X = self.mcp_vectorizer.transform([text])
            prediction = self.mcp_model.predict(X)[0]
            probability = self.mcp_model.predict_proba(X)[0]
            confidence = max(probability)
            return bool(prediction), confidence
        except Exception as e:
            print(f"MCP classification error: {e}")
            return False, 0.0

    def analyze_conversation_context(self, messages):
        """Analyze conversation history for escalating patterns"""
        if not messages:
            return {"escalation_detected": False, "pattern_score": 0}
        
        # Look for escalating negative sentiment
        recent_messages = messages[-5:]  # Last 5 messages
        user_messages = [msg for msg in recent_messages if msg.get("role") == "user"]
        
        risk_words = ["die", "kill", "suicide", "end", "pain", "hopeless", "trapped", "burden"]
        pattern_score = 0
        
        for i, msg in enumerate(user_messages):
            content = msg.get("content", "").lower()
            word_count = sum(1 for word in risk_words if word in content)
            # More recent messages get higher weight
            weight = (i + 1) / len(user_messages)
            pattern_score += word_count * weight
        
        escalation_detected = pattern_score > 2 and len(user_messages) >= 2
        
        return {
            "escalation_detected": escalation_detected,
            "pattern_score": pattern_score,
            "risk_message_count": len([msg for msg in user_messages if any(word in msg.get("content", "").lower() for word in risk_words)])
        }

    def determine_risk_level(self, mcp_positive, mcp_confidence, context_analysis, knowledge_matches):
        """Determine overall risk level based on multiple factors"""
        risk_score = 0
        
        # MCP classification weight
        if mcp_positive:
            risk_score += mcp_confidence * 10
        
        # Context analysis weight
        if context_analysis["escalation_detected"]:
            risk_score += 5
        risk_score += context_analysis["pattern_score"]
        
        # Knowledge base matches weight
        high_risk_categories = ["crisis_phrases", "warning_signs"]
        for match in knowledge_matches:
            if match["category"] in high_risk_categories and match["relevance_score"] > 0.7:
                risk_score += 3
        
        # Determine level
        if risk_score >= 12:
            return "critical"
        elif risk_score >= 8:
            return "high"
        elif risk_score >= 4:
            return "medium"
        else:
            return "low"

    def get_recommended_action(self, risk_level, knowledge_matches):
        """Get appropriate intervention recommendation"""
        actions = {
            "critical": "IMMEDIATE EMERGENCY INTERVENTION: Contact 911 or crisis hotline (988) immediately. Do not leave person alone. Escort to emergency services.",
            "high": "URGENT PROFESSIONAL INTERVENTION: Contact mental health crisis team. Implement safety planning. Monitor continuously.",
            "medium": "PROFESSIONAL CONSULTATION: Schedule mental health assessment within 24-48 hours. Provide crisis resources.",
            "low": "SUPPORTIVE MONITORING: Continue therapeutic conversation. Provide mental health resources if appropriate."
        }
        
        action = actions.get(risk_level, "Continue monitoring")
        
        # Add specific resources based on knowledge matches
        resource_matches = [m for m in knowledge_matches if m["category"] == "resources"]
        if resource_matches and risk_level in ["high", "critical"]:
            action += " Crisis resources: National Suicide Prevention Lifeline (988), Crisis Text Line (text HOME to 741741)."
        
        return action

    def log_high_risk_case(self, analysis_request, analysis_result):
        """Log high-risk cases for admin review and follow-up"""
        if analysis_result["risk_level"] in ["high", "critical"]:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "user_id": analysis_request.user_id,
                "conversation_id": analysis_request.conversation_id,
                "message_content": analysis_request.text,
                "risk_analysis": analysis_result,
                "requires_immediate_attention": analysis_result["risk_level"] == "critical"
            }
            
            # In production, this would go to a secure database and alert system
            print(f"HIGH RISK CASE LOGGED: {json.dumps(log_entry, indent=2)}")
            
            # Here you would:
            # 1. Store in admin dashboard database
            # 2. Send alerts to mental health professionals
            # 3. Trigger emergency protocols if critical
            # 4. Log for compliance and follow-up tracking

    def analyze_suicide_risk(self, request: SuicideAnalysisRequest) -> RiskAnalysisResponse:
        """Comprehensive suicide risk analysis using RAG"""
        print(f"Analyzing suicide risk for text: {request.text[:100]}...")
        
        # MCP Classification
        mcp_positive, mcp_confidence = self.mcp_classify(request.text)
        
        # Retrieve relevant knowledge
        knowledge_matches = self.retrieve_relevant_knowledge(request.text)
        
        # Analyze conversation context
        context_analysis = self.analyze_conversation_context(request.context_messages)
        
        # Determine risk level
        risk_level = self.determine_risk_level(mcp_positive, mcp_confidence, context_analysis, knowledge_matches)
        
        # Calculate overall confidence
        confidence = min(
            (mcp_confidence * 0.4) + 
            (context_analysis["pattern_score"] / 10 * 0.3) + 
            (len([m for m in knowledge_matches if m["relevance_score"] > 0.7]) / 5 * 0.3),
            1.0
        )
        
        # Extract risk factors and contextual cues
        risk_factors = []
        if mcp_positive:
            risk_factors.append(f"Machine learning classification (confidence: {mcp_confidence:.2f})")
        if context_analysis["escalation_detected"]:
            risk_factors.append("Escalating pattern detected in conversation")
        
        contextual_cues = [f"{match['category']}: {match['text'][:100]}..." 
                          for match in knowledge_matches if match['relevance_score'] > 0.6]
        
        # Get recommended action
        recommended_action = self.get_recommended_action(risk_level, knowledge_matches)
        
        result = RiskAnalysisResponse(
            risk_level=risk_level,
            confidence=confidence,
            risk_factors=risk_factors,
            contextual_cues=contextual_cues,
            mcp_classification=mcp_positive,
            recommended_action=recommended_action,
            flagged=risk_level != "low",
            knowledge_base_matches=[f"{m['title']}: {m['text'][:150]}..." for m in knowledge_matches[:3]]
        )
        
        # Log high-risk cases
        self.log_high_risk_case(request, result.dict())
        
        return result

### FASTAPI APP ###
app = FastAPI(title="Enhanced Suicide Detection RAG API")

# Initialize the RAG system
rag_system = SuicideDetectionRAG()

@app.post("/analyze_suicide_risk", response_model=RiskAnalysisResponse)
def analyze_suicide_risk(request: SuicideAnalysisRequest):
    """Analyze text for suicide risk using enhanced RAG system"""
    try:
        return rag_system.analyze_suicide_risk(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/update_knowledge_base")
def update_knowledge_base(documents: List[KnowledgeBaseDocument]):
    """Update the mental health knowledge base"""
    try:
        # Add new documents to knowledge base
        for doc in documents:
            rag_system.knowledge_base.append(doc.dict())
        
        # Rebuild index
        rag_system.build_knowledge_index()
        
        return {"message": f"Knowledge base updated with {len(documents)} new documents"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "knowledge_base_size": len(rag_system.knowledge_base),
        "passages_indexed": len(rag_system.passages),
        "mcp_model_loaded": rag_system.mcp_model is not None
    }

@app.get("/")
def root():
    return {"message": "Enhanced Suicide Detection RAG API. Use /analyze_suicide_risk for analysis."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("enhanced_suicide_detection_api:app", host="0.0.0.0", port=8002, reload=True)
