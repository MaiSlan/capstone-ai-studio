import uuid
from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
import os
import json
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
import subprocess

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
    theme: str
    lore: str
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
    # GROQ TELEMETRY LOGGING
    usage = response.response_metadata.get("token_usage", {})
    total_tokens = usage.get("total_tokens", 0)
    if total_tokens > 0:
        supabase.table("groq_telemetry").insert({"endpoint": "draft-lore", "total_tokens": total_tokens}).execute()
        
    return {"lore": response.content}

@app.post("/api/v1/optimize-tags")
async def optimize_tags(req: OptimizeRequest):
    """Phase 2: Converts the finalized lore into Danbooru tags. (FREE)"""
    prompt = f"""Convert this backstory into a comma-separated Danbooru tag list for an SDXL anime model.
    
    CRITICAL INSTRUCTIONS:
    1. DEDUCE THE SUBJECT: Include EXACTLY ONE of these tags: '1girl', '1boy'.
    2. THE ANATOMY BASE: You MUST start the prompt with exactly these tags:
       '1girl' OR '1boy', solo, simple background, white background, chibi, cute, full body, standing straight, side faced, round face, oversized face, big round eyes,
    3. CHARACTER SPECIFICS: After the base tags, add 5 to 10 highly specific tags describing the character's clothing, expression based on the backstory.
    4. NO REDUNDANCY: Do not repeat similar concepts.
    5. NO BACKGROUNDS: Strictly exclude tags about environments, cities, weather, or lighting.
    6. OUTPUT FORMAT: Return ONLY the comma-separated tags. NO introductory text.

    Backstory: {req.lore}"""
    
    response = llm.invoke(prompt)
    
    # GROQ TELEMETRY LOGGING
    usage = response.response_metadata.get("token_usage", {})
    total_tokens = usage.get("total_tokens", 0)
    if total_tokens > 0:
        supabase.table("groq_telemetry").insert({"endpoint": "optimize-tags", "total_tokens": total_tokens}).execute()
        
    return {"optimized_prompt": response.content}

# Helper function that runs completely detached in the background
def orchestrate_gpu_background(generation_id: str, user_id: str, req_optimized_prompt: str, req_theme: str, req_lore: str):
    import requests
    import json
    import os
    
    final_prompt = "score_9, score_8_up, score_7_up, masterpiece, flat colors, " + req_optimized_prompt
    
    try:
        with open("workflows/character_template.json", "r") as f:
            comfy_workflow = json.load(f)
            
        comfy_workflow["9"]["inputs"]["text"] = final_prompt 
        modal_url = os.getenv("MODAL_WEBHOOK_URL")
        
        response = requests.post(modal_url, json=comfy_workflow, timeout=90)
        response.raise_for_status()
        modal_data = response.json()
        
        raw_images = modal_data.get("images", [])
        valid_images = [img for img in raw_images if isinstance(img, str) and len(img) > 100]
        
        if valid_images:
            # Task Succeeded: Save the image data and flip status to completed
            supabase.table("generations").update({
                "status": "completed",
                "image_data": valid_images[0] # Save the primary base64 image string
            }).eq("id", generation_id).execute()
            
            # Securely charge the token only on a true absolute success
            supabase.rpc("decrement_token", {"target_user_id": user_id}).execute()
        else:
            raise Exception("No valid image matrices returned from tensor grid.")
            
    except Exception as e:
        print(f"Background GPU Task Failed for job {generation_id}: {str(e)}")
        # Task Failed: Update status so the frontend can display the crash gracefully
        supabase.table("generations").update({"status": "failed"}).eq("id", generation_id).execute()


@app.post("/api/v1/render-image")
async def render_image(req: RenderRequest, background_tasks: BackgroundTasks, user = Depends(verify_token)):
    """Phase 3: Instantly registers a background worker job to prevent gateway timeouts."""
    
    # 1. SERVER-SIDE BALANCE CHECK (Restored!)
    profile_res = supabase.table("profiles").select("tokens").eq("id", user.id).execute()
    if not profile_res.data or profile_res.data[0]["tokens"] <= 0:
        raise HTTPException(status_code=402, detail="Payment Required: Insufficient tokens.")
        
    # 2. Generate a secure tracking ID locally to completely prevent Supabase IndexErrors
    generation_id = str(uuid.uuid4())
    
    # 3. Create a secure tracking slot in the global database ledger instantly
    try:
        supabase.table("generations").insert({
            "id": generation_id,
            "user_id": user.id,
            "theme": req.theme,
            "lore": req.lore,
            "optimized_prompt": req.optimized_prompt,
            "status": "processing"
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database ledger failed: {str(e)}")
    
    # 4. Delegate the 65-second GPU cold start to an isolated background thread
    background_tasks.add_task(
        orchestrate_gpu_background, 
        generation_id, user.id, req.optimized_prompt, req.theme, req.lore
    )
    
    # 5. Hand control back to Next.js in 100 milliseconds so the browser never experiences a timeout
    return {"status": "queued", "generation_id": generation_id}

# 3. Add a lightning-fast status checker endpoint
@app.get("/api/v1/render-status/{generation_id}")
async def check_render_status(generation_id: str, user = Depends(verify_token)):
    """Allows the frontend to loop-check on background worker status securely."""
    res = supabase.table("generations").select("status", "image_data").eq("id", generation_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Job footprint not found.")
    return res.data

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
    
@app.get("/api/v1/admin/billing")
async def get_billing_telemetry(admin_user = Depends(verify_admin)):
    """Fetches live cloud spend from Modal's FinOps API."""
    try:
        # We use subprocess to leverage Modal's built-in date math (--for "this month")
        # Modal automatically authenticates using the MODAL_TOKEN_ID in the environment.
        result = subprocess.run(
            ["modal", "billing", "report", "--for", "this month", "--json"],
            capture_output=True, text=True, check=True
        )
        
        # Parse the CLI's JSON string into a Python dictionary/list
        billing_data = json.loads(result.stdout)
        
        return {"status": "success", "data": billing_data}
        
    except subprocess.CalledProcessError as e:
        print(f"Modal CLI Error: {e.stderr}")
        raise HTTPException(status_code=500, detail="Failed to fetch FinOps telemetry.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))