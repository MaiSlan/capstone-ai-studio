import modal
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# 1. Define the isolated Modal environment
app = modal.App("flufforia-bg-engine")

# 2. Install the rembg library and FastAPI
image = modal.Image.debian_slim().pip_install("rembg[cli]", "pillow", "fastapi")

# 3. Create a FastAPI router to handle CORS so your Next.js app can talk to it
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
    
    # 4. Load the holy grail model for 2D character art
    session = new_session("isnet-anime")
    
    # 5. Execute the tensor math
    result_bytes = remove(image_bytes, session=session)
    
    return Response(content=result_bytes, media_type="image/png")

# 6. Expose the app to the internet
@app.function(image=image, cpu=2.0, memory=2048)
@modal.asgi_app()
def fastapi_app():
    return web_app