#source venv/bin/activate    uvicorn server:app --host 0.0.0.0 --port 4600 --reload
#here is a change to test git pull
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn 
from rag import query, get_embedding, clear
from system_instruction import write_custom_instruction, get_instruction
from bot import set_mode, get_mode

app = FastAPI()

@app.get("/get_instruction/{name}/{database_name}")
async def get_instructions(name: str, database_name: str):
    return get_instruction(name, database_name)

class CustomInstruction(BaseModel):
  name: str | None = None
  instructions: str
  database_name: str

@app.post("/set_custom_instruction")
async def set_custom_instruction(payload: CustomInstruction):
  try:
    write_custom_instruction(payload.instructions, payload.database_name)
    return {"status": f"Custom instruction updated for {payload.name or 'default'}"}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_mode")
async def get_mode_endpoint():
    mode = get_mode()
    return {"mode": mode}

@app.post("/set_mode/{mode}/{database_name}")
async def set_mode_endpoint(mode: str, database_name: str):
    set_mode(mode)
    return {"status": f"Mode set to {mode}"}

@app.get("/question/{message}/{database_name}")
async def ping(message: str, database_name: str):
    return query(message, database_name)

@app.get("/embed/{file_name}/{folder}/{ID}/{verifier}/{database_name}")
async def embed(file_name: str,folder: str, ID: int, verifier: str, database_name: str):
    print("got file name to back end: ", file_name, " folder:", folder)
    get_embedding(file_name, folder, ID, verifier, database_name)
    return {"status": "Embedding started for file", "file_name": file_name}

@app.get("/reset")
async def reset():
    print("resetting the database")
    clear()
    return {"status": "Database reset"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4600, reload=True)