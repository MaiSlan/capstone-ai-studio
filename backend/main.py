from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
import os
import json
import requests
from dotenv import load_dotenv
from typing import TypedDict
from langgraph.graph import StateGraph, END
from supabase import create_client, Client

load_dotenv()

app = FastAPI(title="AI Studio Hybrid Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# GATEKEEPER
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def verify_token(authorization: str = Header(None)):
    """Extracts the JWT from the frontend, verifies it, and returns the user ID."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing authentication token.")
    
    token = authorization.split(" ")[1]
    try:
        # Supabase cryptographically verifies the token
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token.")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# ==========================================
# 3. THE CLOUD ENGINE
# ==========================================
llm = ChatGroq(
    api_key=os.getenv("LLM_API_KEY"),
    model="llama-3.1-8b-instant"
)

# ==========================================
# 4. DATA MODELS
# ==========================================
class ConceptRequest(BaseModel):
    theme: str

class AgentState(TypedDict):
    theme: str
    lore: str
    image_prompt: str
    images: list

# ==========================================
# 5. THE LANGGRAPH AGENTIC PIPELINE
# ==========================================
def writer_node(state: AgentState):
    print(f"--> [Node 1] Cloud Writer generating lore for: {state['theme']}")
    prompt = f"You are a video game writer. Write a rich, 2-paragraph character backstory based on this theme: {state['theme']}"
    response = llm.invoke(prompt)
    return {"lore": response.content}

def art_director_node(state: AgentState):
    print("--> [Node 2] Cloud Art Director optimizing Danbooru tags...")
    prompt = f"""Convert this backstory into a comma-separated Danbooru tag list for an anime model.
    CRITICAL INSTRUCTIONS:
    1. DEDUCE THE SUBJECT: Include EXACTLY ONE of these tags based on the character: '1girl', '1boy', or 'mecha'.
    2. MANDATORY TAGS: Always include 'solo, single character, white background, simple background'.
    3. STRICTLY EXCLUDE BACKGROUNDS: Do NOT include any tags about environments, cities, ruins, streets, neon, or weather.
    4. OUTPUT FORMAT: Return ONLY the comma-separated tags. NO introductory text. NO explanations. NO conversational filler.

    Backstory: {state['lore']}"""
    response = llm.invoke(prompt)
    return {"image_prompt": response.content}

def artist_node(state: AgentState):
    print("--> [Node 3] Orchestrating Modal Cloud GPU...")
    
    final_prompt = "score_9, masterpiece, chibi, super deformed, full body, standing, flat colors, white background, " + state["image_prompt"]
    
    with open("workflows/character_template.json", "r") as f:
        comfy_workflow = json.load(f)
        
    comfy_workflow["9"]["inputs"]["text"] = final_prompt 
    
    MODAL_WEBHOOK_URL = os.getenv("MODAL_WEBHOOK_URL")
    if not MODAL_WEBHOOK_URL:  
        MODAL_WEBHOOK_URL = "https://maislan-ai-studio--ai-studio-comfyui-comfyuiengine-gener-a7845f.modal.run"
    
    try:
        response = requests.post(MODAL_WEBHOOK_URL, json=comfy_workflow, timeout=300)
        response_data = response.json()
        
        if response_data.get("status") == "success":
            base64_images = response_data.get("images", [])
            print(f"✅ Successfully generated {len(base64_images)} frame(s)!")
            return {"images": base64_images}
        else:
            print("❌ Modal generation failed internally. Check Modal dashboard logs.")
            return {"images": []}
            
    except Exception as e:
        print(f"❌ Failed to reach Modal Engine: {e}")
        return {"images": []}
# Wire the Graph
workflow = StateGraph(AgentState)
workflow.add_node("writer", writer_node)
workflow.add_node("art_director", art_director_node)
workflow.add_node("artist", artist_node)

workflow.set_entry_point("writer")
workflow.add_edge("writer", "art_director")
workflow.add_edge("art_director", "artist")
workflow.add_edge("artist", END)

studio_app = workflow.compile()

# ==========================================
# ENDPOINT
# ==========================================
@app.post("/api/v1/generate-character")
async def generate_character(req: ConceptRequest, user = Depends(verify_token)):
    print(f"🎬 Authenticated Request from User: {user.id} | Theme: {req.theme}")
    
    # 1. SERVER-SIDE BALANCE CHECK
    profile_res = supabase.table("profiles").select("tokens").eq("id", user.id).execute()
    if not profile_res.data or profile_res.data[0]["tokens"] <= 0:
        raise HTTPException(status_code=402, detail="Payment Required: Insufficient tokens.")
    
    # 2. RUN THE CLOUD PIPELINE
    initial_state = {"theme": req.theme, "lore": "", "image_prompt": "", "images": []}
    result = studio_app.invoke(initial_state)
    
    # 3. SECURE ATOMIC DECREMENT
    # This calls the SQL function we created to safely deduct 1 token
    supabase.rpc("decrement_token", {"target_user_id": user.id}).execute()
    
    return {
        "status": "pipeline_complete",
        "theme": result["theme"],
        "lore": result["lore"],
        "optimized_prompt": result["image_prompt"],
        "images": result["images"]
    }