with open('main.py', 'r') as f:
    text = f.read()

text = text.replace(
    'if SUPABASE_URL and SUPABASE_KEY:',
    'if SUPABASE_URL and SUPABASE_URL != "YOUR_SUPABASE_URL" and SUPABASE_KEY and SUPABASE_KEY != "YOUR_SUPABASE_SECRET_KEY":'
)

with open('main.py', 'w') as f:
    f.write(text)
