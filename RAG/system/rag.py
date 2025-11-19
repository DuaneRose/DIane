#you have to use a virtual environment to run this code "source .venv/bin/activate" python embed.py
from bot import upload, delete_upload, ask
from txt_pull import routing
from embedding import embed, clear_collection, search_vector
from system_instruction import write_custom_instruction
from pypdf import PdfReader, PdfWriter
import math

# Function to chunk text into three parts: two halves and the middle
def chunker(text):
    print("chunking text")
    words = text.split(" ")
    chunks = []
    for i in range(0, math.ceil(len(words)/75)):
        if i == 0:
            start = 0
        else:
            start = i * 75 - 10

        end = start + 75 + 20
        if end > len(words):
            end = len(words)
        chunks.append(" ".join(words[start:end]))

    print("chunking is done")
    return chunks

# Function to get embeddings from the PDF file and save them to a JSON file
def get_embedding(file_name, folder, ID, verifier, folder_name):
    print("getting embeddings for " + file_name)

    if folder != "text_books":
        genai_id = upload(file_name, folder, folder_name)

        text = routing(file_name, folder, genai_id, folder_name)
        if text != "File type not implemented":
            chunks = chunker(text)
            embed(chunks, file_name, folder, ID, verifier, genai_id, folder_name)
        else:
            print("File type not implemented: " + file_name)
    else:
        book = PdfReader("/Users/duanegennaro/dIAne/data_base/" + folder_name + "/text_books/" + file_name)
        num_pages = len(book.pages)
        for i in range(num_pages):
            print("processing page ", i)
            page = book.pages[i]
            text = page.extract_text()
            embed([text], file_name, folder, ID, verifier, genai_id="", page_num=i)

def clear():
    delete_upload()
    clear_collection()
    write_custom_instruction(" ")
    
def pull(prompt, folder_name, num_files=3):
    top_files = search_vector(prompt, folder_name)

    sorted_files = sorted(top_files, key=lambda x: x['score'], reverse=True)
    sorted_files = sorted_files[:num_files]
    return sorted_files        

def get_signature(start_page, end_page, name, num):
    print("getting signature for ", name)
    book = PdfReader("/Users/duanegennaro/dIAne/data_base/text_books/" + name)
    sig = PdfWriter()
    for i in range(start_page, end_page):
        if i < len(book.pages):
            sig.add_page(book.pages[i])

    sig_path = "/Users/duanegennaro/dIAne/data_base/signatures/" + name[:-4] + "(" + str(num) + ")" + "_sig.pdf"
    with open(sig_path, "wb") as f:
        sig.write(f)

    return sig_path

def query(prompt,folder_name):
    files = pull(prompt,folder_name)

    num = 0
    print(len(files), " files retrieved")
    for file in files:
        if file['folder'] == 'text_books':
            print("creating signature")
            range_start = file['page_num'] - 2
            range_end = file['page_num'] + 2
            max = len(PdfReader("/Users/duanegennaro/dIAne/data_base/"+ folder_name +"/text_books/" + file['file_name']).pages)

            if range_start < 0 and range_end > max:
                range_start = 0
                range_end = max
            elif range_start < 0:
                range_start = 0
                range_end += 2
            elif range_end >  max:
                range_end = max
                range_start -= 2
            print("page range: ", range_start," --->", range_end)
            path = get_signature(range_start, range_end, file['file_name'], num)
            file['to_detelete'] = path
            file['genai_id'] = upload(path, 'text_books')
            num += 1
            print("signature created")
            

    return ask(prompt, files, folder_name)