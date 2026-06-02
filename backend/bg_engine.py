import modal
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# 1. Define the isolated Modal environment
app = modal.App("flufforia-bg-engine")

# 2. Pre-bake the model into the container so it never downloads at runtime
MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx"

image = (
    modal.Image.debian_slim()
    .apt_install("curl") # <--- THE FIX: Install curl first
    .pip_install("rembg[cpu]", "onnxruntime", "pillow", "fastapi")
    .run_commands(
        # Create the exact hidden directory rembg looks for
        "mkdir -p /root/.u2net",
        # Download the anime model directly into the image during the build
        f"curl -L -o /root/.u2net/isnet-anime.onnx {MODEL_URL}"
    )
)

# 3. Create a FastAPI router
web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@web_app.post("/")
async def remove_background(request: Request):
    from rembg import remove, new_session
    
    image_bytes = await request.body()
    
    # 4. This will now load instantly from the local SSD
    session = new_session("isnet-anime")
    
    # 5. Execute the tensor math
    result_bytes = remove(image_bytes, session=session)
    
    return Response(content=result_bytes, media_type="image/png")

# 6. Expose the app to the internet
@app.function(image=image, cpu=2.0, memory=2048)
@modal.asgi_app()
def fastapi_app():
    return web_app