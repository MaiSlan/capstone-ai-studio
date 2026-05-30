from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
import os
import json
import requests
from dotenv import load_dotenv
from typing import TypedDict
from langgraph.graph import StateGraph, END

load_dotenv()

# ==========================================
# 1. INIT THE SERVER (THIS MUST BE FIRST!)
# ==========================================
app = FastAPI(title="AI Studio Hybrid Engine")

# ==========================================
# 2. THE CORS FIX (THIS MUST BE SECOND!)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vercel to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
# 6. THE MASTER ENDPOINT
# ==========================================
@app.post("/api/v1/generate-character")
async def generate_character(req: ConceptRequest):
    print(f"🎬 Starting Studio Pipeline for: {req.theme}")
    
    initial_state = {"theme": req.theme, "lore": "", "image_prompt": "", "images": []}
    result = studio_app.invoke(initial_state)
    
    return {
        "status": "pipeline_complete",
        "theme": result["theme"],
        "lore": result["lore"],
        "optimized_prompt": result["image_prompt"],
        "images": result["images"]
    }