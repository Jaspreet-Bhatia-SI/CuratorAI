import services
try:
    res = services.search_youtube("python basics", "education")
    print(res)
except Exception as e:
    print("YT ERROR:", e)
