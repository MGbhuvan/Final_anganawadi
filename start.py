import sys
import os
import threading
import uvicorn
import webbrowser

# Add the backend directory to the Python path
backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

# Import PORT after adding to path
from app.config import PORT

def open_site():
    webbrowser.open(f"http://localhost:{PORT}/intro.html")

if __name__ == "__main__":
    print(f"Starting Poshan Abhiyan from root...")
    threading.Timer(1.2, open_site).start()
    # Run uvicorn pointing to the app module inside backend
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=False)
