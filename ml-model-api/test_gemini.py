
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
model_name = os.getenv('GEMINI_MODEL')

print(f"Testing Model: {model_name}")

if not api_key:
    print("Error: No API key found")
    exit(1)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Test")
    print("SUCCESS: Generated content")
    print(response.text)
except Exception as e:
    print(f"ERROR: {e}")
