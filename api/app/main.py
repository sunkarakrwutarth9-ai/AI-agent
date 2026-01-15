from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict
from groq import Groq
import uuid
import time
import os

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Groq API Key - Set via environment variable GROQ_API_KEY
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# In-memory storage for hosted HTML pages (in production, use a database)
hosted_pages: Dict[str, dict] = {}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str

class HostHTMLRequest(BaseModel):
    html: str
    title: str = "PulseBuilder Page"

class HostHTMLResponse(BaseModel):
    id: str
    url: str

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Build messages with system prompt
        messages = [
            {
                "role": "system",
                "content": """You are PulseBuilder, an advanced AI assistant similar to Devin. You can help with:
- Writing, debugging, and explaining code in any programming language
- Generating complete applications and projects
- Answering questions on any topic
- Providing detailed explanations and tutorials
- Helping with web development, mobile apps, and more

IMPORTANT RULES:
1. ALWAYS provide COMPLETE, WORKING code - never truncate or use "..." or "// rest of code"
2. When generating HTML, include ALL necessary CSS and JavaScript inline
3. Make sure all code is ready to deploy without modifications
4. For web apps, provide single-file HTML that works standalone
5. Include all imports, dependencies, and complete implementations

Be helpful, detailed, and provide code examples when relevant. Format your responses with markdown for better readability."""
            }
        ]
        
        # Add user messages
        for m in request.messages:
            messages.append({"role": m.role, "content": m.content})
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=8192,
            temperature=0.7
        )
        
        return ChatResponse(response=completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/host", response_model=HostHTMLResponse)
async def host_html(request: HostHTMLRequest):
    """Host HTML content and return a shareable URL"""
    try:
        page_id = str(uuid.uuid4())[:8]
        hosted_pages[page_id] = {
            "html": request.html,
            "title": request.title,
            "created": time.time()
        }
        
        # Clean up old pages (keep only last 100)
        if len(hosted_pages) > 100:
            oldest_keys = sorted(hosted_pages.keys(), key=lambda k: hosted_pages[k]["created"])[:50]
            for key in oldest_keys:
                del hosted_pages[key]
        
        return HostHTMLResponse(
            id=page_id,
            url=f"https://app-xjdhhtie.fly.dev/page/{page_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/page/{page_id}", response_class=HTMLResponse)
async def get_hosted_page(page_id: str):
    """Serve a hosted HTML page"""
    if page_id not in hosted_pages:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return hosted_pages[page_id]["html"]
