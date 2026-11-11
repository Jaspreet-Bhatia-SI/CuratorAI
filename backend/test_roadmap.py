import sys
from services import generate_roadmap_json
import os

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    # Just grab it from .env file for testing if possible, or print skip
    pass

res = generate_roadmap_json("html only", "groq", api_key)
print(res)
