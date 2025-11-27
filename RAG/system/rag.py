#you have to use a virtual environment to run this code "source .venv/bin/activate" python embed.py
from bot import upload, delete_upload, ask
from txt_pull import routing
from embedding import embed, clear_collection, search_vector
from system_instruction import write_custom_instruction
from pypdf import PdfReader, PdfWriter
# from PyPDF2 import PdfReader
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
def get_embedding(file_name, folder, ID, verifier, database_name):
    print("getting embeddings for " + file_name)

    if folder != "text_books":
        text = routing(file_name, folder, database_name)
        if text != "File type not implemented":
            chunks = chunker(text)
            embed(chunks, file_name, folder, ID, verifier, database_name)
        else:
            print("File type not implemented: " + file_name)
    else:
        book = PdfReader("/Users/duanegennaro/dIAne/data_base/" + database_name + "/text_books/" + file_name)
        num_pages = len(book.pages)
        for i in range(num_pages):
            print("processing page ", i)
            page = book.pages[i]
            text = page.extract_text()
            if text is None:
                continue
            chunks = chunker(text)
            embed(chunks, file_name, folder, ID, verifier,database_name, page_num=i)

def clear():
    delete_upload()
    clear_collection()
    write_custom_instruction(" ")
    
def pull(prompt, database_name, num_files=3):
    top_files = search_vector(prompt, database_name)

    average(top_files)
    sorted_files = sorted(top_files, key=lambda x: x['average'], reverse=True)
    sorted_files = sorted_files[:num_files]
    return sorted_files        

def average(vectors):
    for vector in vectors:
        vector["average"] = vector["score"] / vector["hits"]

def get_signature(start_page, end_page, name, num, database_name):
    print("getting signature for ", name)
    book = PdfReader("/Users/duanegennaro/dIAne/data_base/"+ database_name +"/text_books/" + name)
    sig = PdfWriter()
    for i in range(start_page, end_page):
        if i < len(book.pages):
            sig.add_page(book.pages[i])

    sig_path = "/Users/duanegennaro/dIAne/data_base/"+ database_name +"/signatures/" + name[:-4] + "(" + str(num) + ")" + "_sig.pdf"
    with open(sig_path, "wb") as f:
        sig.write(f)

    return sig_path

def query(prompt,database_name):
    files = pull(prompt, database_name)

    num = 0
    print(len(files), " files retrieved")
    for file in files:
        if file['folder'] == 'text_books':
            print("creating signature")
            range_start = file['page_num'] - 2
            range_end = file['page_num'] + 2
            max = len(PdfReader("/Users/duanegennaro/dIAne/data_base/"+ database_name +"/text_books/" + file['file_name']).pages)

            if range_start < 0 and range_end > max:
                range_start = 0
                range_end = max
            elif range_start < 0 and range_end + 2 <= max:
                range_start = 0
                range_end += 2
            elif range_end > max and range_start - 2 >= 0:
                range_end = max
                range_start -= 2
            elif range_start < 0:
                range_start = 0
            elif range_end > max:
                range_end = max

            print("page range: ", range_start," ---> ", range_end)
            path = get_signature(range_start, range_end, file['file_name'], num, database_name)
            file['to_detelete'] = path
            file['genai_id'] = upload(path, 'text_books', database_name)
            num += 1
            print("signature created")
        else:
            file['genai_id'] = upload(file['file_name'], file['folder'], database_name)
            print("uploaded ", file['file_name'])
            

    return ask(prompt, files, database_name)