from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
import os
import json
import requests
from dotenv import load_dotenv
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
# 1. SECURITY / GATEKEEPER
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing authentication token.")
    token = authorization.split(" ")[1]
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token.")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    
# ==========================================
# 1.5 ADMIN GATEKEEPER
# ==========================================
def verify_admin(authorization: str = Header(None)):
    """Verifies the token AND checks if the user has the 'admin' role."""
    user = verify_token(authorization)
    
    profile_res = supabase.table("profiles").select("role").eq("id", user.id).execute()
    if not profile_res.data or profile_res.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin clearance required.")
    
    return user

# ==========================================
# 2. AI ENGINE INITIALIZATION
# ==========================================
llm = ChatGroq(
    api_key=os.getenv("LLM_API_KEY"),
    model="llama-3.1-8b-instant"
)

# ==========================================
# 3. MODULAR DATA MODELS
# ==========================================
class DraftRequest(BaseModel):
    theme: str

class OptimizeRequest(BaseModel):
    lore: str

class RenderRequest(BaseModel):
    optimized_prompt: str

# ==========================================
# 4. DECOUPLED PIPELINE ENDPOINTS
# ==========================================

@app.post("/api/v1/draft-lore")
async def draft_lore(req: DraftRequest):
    """Phase 1: Generates the character backstory. (FREE)"""
    prompt = f"""You are a concept artist. The user wants a character based on this theme: '{req.theme}'.
    Write a 1-paragraph visual appearance and a 1-paragraph backstory.
    Keep it concise, highly detailed, and evocative. Do NOT add conversational filler."""
    
    response = llm.invoke(prompt)
    return {"lore": response.content}


@app.post("/api/v1/optimize-tags")
async def optimize_tags(req: OptimizeRequest):
    """Phase 2: Converts the finalized lore into Danbooru tags. (FREE)"""
    prompt = f"""Convert this backstory into a comma-separated Danbooru tag list for an anime model.
    CRITICAL INSTRUCTIONS:
    1. DEDUCE THE SUBJECT: Include EXACTLY ONE of these tags: '1girl', '1boy', or 'mecha'.
    2. MANDATORY TAGS: Always include 'solo, single character, white background, simple background'.
    3. STRICTLY EXCLUDE BACKGROUNDS: Do NOT include any tags about environments, cities, or weather.
    4. OUTPUT FORMAT: Return ONLY the comma-separated tags. NO introductory text.

    Backstory: {req.lore}"""
    
    response = llm.invoke(prompt)
    return {"optimized_prompt": response.content}


@app.post("/api/v1/render-image")
async def render_image(req: RenderRequest, user = Depends(verify_token)):
    """Phase 3: Executes the Modal GPU workflow and deducts a token. (PAID)"""
    
    # 1. SERVER-SIDE BALANCE CHECK
    profile_res = supabase.table("profiles").select("tokens").eq("id", user.id).execute()
    if not profile_res.data or profile_res.data[0]["tokens"] <= 0:
        raise HTTPException(status_code=402, detail="Payment Required: Insufficient tokens.")
    
    # 2. INJECT PAYLOAD INTO JSON WORKFLOW
    final_prompt = "score_9, masterpiece, chibi, super deformed, full body, standing, flat colors, white background, " + req.optimized_prompt
    
    with open("workflows/character_template.json", "r") as f:
        comfy_workflow = json.load(f)
        
    comfy_workflow["9"]["inputs"]["text"] = final_prompt 
    
    modal_payload = {"prompt": comfy_workflow}
    modal_url = os.getenv("MODAL_WEBHOOK_URL")
    
    # 3. FIRE THE GPU
    print("--> Orchestrating Modal Cloud GPU...")
    try:
        response = requests.post(modal_url, json=modal_payload, timeout=90)
        response.raise_for_status()
        modal_data = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Modal Engine Error: {str(e)}")

    # 4. SECURE ATOMIC DECREMENT
    supabase.rpc("decrement_token", {"target_user_id": user.id}).execute()
    
    return {"images": modal_data.get("images", [])}

# ==========================================
# 5. ADMIN UTILITIES
# ==========================================
@app.delete("/api/v1/admin/users/{target_id}")
async def delete_user(target_id: str, admin_user = Depends(verify_admin)):
    """Wipes a user's generations, profile, and authentication identity."""
    
    # Prevent the admin from accidentally deleting themselves
    if target_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot terminate your own command account.")
    
    try:
        # 1. Wipe the history (prevents database locking errors)
        supabase.table("generations").delete().eq("user_id", target_id).execute()
        # 2. Wipe the public profile
        supabase.table("profiles").delete().eq("id", target_id).execute()
        # 3. Destroy the root authentication identity using the Master Key
        supabase.auth.admin.delete_user(target_id)
        
        return {"status": "success", "message": "Operator terminated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Termination failed: {str(e)}")