import modal
import subprocess
import time
import json
import os
import urllib.request

app = modal.App("ai-studio-comfyui")

model_volume = modal.Volume.from_name("ai-models-vol", environment_name="AI_Studio")

# ==========================================
# 📦 STEP 1: BAKE THE BRIA MODEL
# ==========================================
def download_bria():
    from huggingface_hub import hf_hub_download
    print("Authenticating with Hugging Face and downloading BRIA...")
    bria_path = "/workspace/ComfyUI/custom_nodes/ComfyUI-BRIA_AI-RMBG/RMBG-1.4"
    os.makedirs(bria_path, exist_ok=True)
    hf_hub_download(
        repo_id="briaai/RMBG-1.4",
        filename="model.pth",
        local_dir=bria_path,
        token=os.environ["HF_TOKEN"]
    )

# ==========================================
# 🐳 STEP 2: BUILD THE CONTAINER
# ==========================================
comfyui_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git")
    .pip_install("huggingface_hub", "fastapi[standard]")
    .run_commands(
        "git clone https://github.com/comfyanonymous/ComfyUI.git /workspace/ComfyUI",
        "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121",
        "pip install -r /workspace/ComfyUI/requirements.txt",
        "python -c \"open('/workspace/ComfyUI/extra_model_paths.yaml', 'w').write('modal:\\n    base_path: /modal_volume\\n    checkpoints: checkpoints\\n    loras: loras\\n')\"",
        "git clone https://github.com/ZHO-ZHO-ZHO/ComfyUI-BRIA_AI-RMBG /workspace/ComfyUI/custom_nodes/ComfyUI-BRIA_AI-RMBG"
    )
    .run_function(
        download_bria,
        secrets=[modal.Secret.from_name("huggingface-secret")] 
    )
)

# ==========================================
# 🚀 STEP 3: THE LIFECYCLE API CLASS
# ==========================================
@app.cls(
    image=comfyui_image, 
    gpu="A10G", 
    timeout=300, 
    volumes={"/modal_volume": model_volume}
)
class ComfyUIEngine:
    
    @modal.enter()
    def startup(self):
        """This runs ONCE when the container wakes up. It boots the server."""
        print("Booting ComfyUI Server...")
        self.server_process = subprocess.Popen(["python", "/workspace/ComfyUI/main.py"])
        time.sleep(15)
        
    @modal.exit()
    def shutdown(self):
        """This safely kills the server when the container scales down to 0."""
        self.server_process.terminate()

    @modal.fastapi_endpoint(method="POST")
    def generate_sprite(self, workflow_json: dict):
        """This handles incoming API requests."""
        import base64
        
        # 1. Send Prompt to local ComfyUI
        data = json.dumps({"prompt": workflow_json}).encode("utf-8")
        req = urllib.request.Request("http://127.0.0.1:8188/prompt", data=data)
        
        try:
            urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:
            return {"status": "error", "message": f"ComfyUI rejected the workflow: {e.read().decode()}"}
        
        # 2. Wait for generation
        time.sleep(45) 
        
        # 3. Read Output
        output_dir = "/workspace/ComfyUI/output/"
        files = sorted(os.listdir(output_dir))
        
        images_base64 = []
        for file in files:
            if file.endswith(".png"):
                file_path = os.path.join(output_dir, file)
                with open(file_path, "rb") as image_file:
                    images_base64.append(base64.b64encode(image_file.read()).decode('utf-8'))
                os.remove(file_path)
        
        return {"status": "success", "images": images_base64}