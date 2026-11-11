import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("frontend/.env")
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("queries_cache").select("*").eq("query_text", "html").execute()
print("SELECT:", res)
