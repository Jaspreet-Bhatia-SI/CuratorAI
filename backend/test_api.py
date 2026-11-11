import requests

try:
    response = requests.post(
        "http://localhost:8000/api/generate-roadmap",
        json={"query": "python basics"},
        headers={"X-AI-Provider": "gemini", "X-AI-Key": "fake_key"}
    )
    print(response.status_code)
    print(response.text)
except Exception as e:
    print("Error:", e)
