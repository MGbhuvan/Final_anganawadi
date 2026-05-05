import urllib.request
import json

url = "http://127.0.0.1:8000/api/children"
data = json.dumps({
    "child_code": "CHILD999",
    "name": "Test Child",
    "mother_id": "PW999",
    "age": 12,
    "weight": 10.5,
    "height": 80.0,
    "vaccination_status": "Complete"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        print("Success:", f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Error {e.code}:", e.read().decode('utf-8'))
