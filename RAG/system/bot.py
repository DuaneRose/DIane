import time, subprocess
import os
from google import genai
from pathlib import Path
from google import genai
from google.genai.types import GenerateContentConfig
import subprocess, os, time
from system_instruction import get_instruction

key = "AIzaSyBmMUZq-6XSgNx9LsrzNHzLk5wD8mR9phw"
client = genai.Client(api_key=key)
vector_space = "../vectorSpace/embeddings(DS).json"
chat_model = "gemini-2.5-flash"
system_prompt = "be you for now, you are a helpful assistant"
mode = "default"

def get_mode():
    global mode
    return mode

def set_mode(new_mode):
    global mode
    mode = new_mode

def delete_upload():
    files = client.files.list()
    for file in files:
        print("deleting", file.name)
        client.files.delete(name=file.name)

def upload(file_name, folder):
    print("uploading file:", file_name, " to folder:", folder)
    path = Path("/Users","duanegennaro","dIAne","data_base", folder, file_name)
    print("resolved path:", path.resolve())
    file_path = path.resolve()
    print("uploading")

    if file_path.suffix.lower() in ['.txt', '.docx', '.doc', '.csv', '.pptx', '.ppt']:
        print(f"File type {file_path.suffix} not supported for upload.")
        print("so we are converting it to a pdf")

        input_path = Path(file_path).resolve()
        output_path = Path(file_path.parent).resolve()

        subprocess.run([
            "soffice", "--headless", "--convert-to", "pdf",
            str(input_path),
            "--outdir", str(output_path)
        ], check=True)

        new_path = output_path / (input_path.stem + ".pdf")
        print("old path", file_path)
        print("new path", new_path)

        obj = client.files.upload(
        file=new_path,
        )
        os.remove(new_path)
    else:
        print("file type is supported")
        print(f"Uploading file {file_path} directly.")

        obj = client.files.upload(
            file=file_path,
        )

    while True:
        f = client.files.get(name=obj.name)
        state = getattr(f, "state", None)
        if state == "ACTIVE":
            print("file is active")
            obj = f 
            break
        else:
            print("file is not active yet, waiting...")
            time.sleep(1)

    return obj.name

def ask(prompt, files):

    folder = []
    for i in range(len(files)):
        print(f"used {files[i]['file_name']} with score {files[i]['score']}")
        folder.append(files[i]["genai_id"])

    json_path = Path("/Users","duanegennaro","dIAne","data_base") / "db.json"
    
    with open(json_path) as r:
        json_text = r.read()

    system_prompt = get_instruction(mode)
    print("using mode ", mode)

    print("asking question")
    response = client.models.generate_content(
        model=chat_model,
        contents=[
            json_text, folder,
            prompt
    ],
    config=GenerateContentConfig(
        system_instruction=system_prompt
    ),
    )

    for file in files:
        if file['folder'] == 'text_books':
            cleanup(file['genai_id'])

            if os.path.exists(file['to_detelete']):
                os.remove(file['to_detelete'])
                print("removed", file['to_detelete'])
            else :
                print("file to delete not found:", file['to_detelete'])
     
    print(response.text)
    return response.text

def cleanup(genai_id):
    client.files.delete(name=genai_id)

def ai_assist(genai_id):
    response = client.models.generate_content(
        
        model="gemini-1.5-flash",
        contents=["Please convert this file to text:\n\n",client.files.get(name=genai_id)]
    )

    return response.text