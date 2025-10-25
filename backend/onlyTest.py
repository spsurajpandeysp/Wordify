# server.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

# Define a GET route
@app.get("/hello")
def hello():
    return JSONResponse(content={"message": "Hello, World!"})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)