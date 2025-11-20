# from files import retrieve_file
from ollama import embeddings
import json
from pathlib import Path
import numpy as np

def embed(chunks, file_name, folder, ID, verifier, database_name, page_num = -1):
    print("embedding the chunks")

    vector_path = Path("/Users","duanegennaro","dIAne","data_base",database_name ,"vector_space.json")
    with open(vector_path, "r") as vectors:
        vector_space = json.load(vectors)

        print(len(vector_space))

        for chunk in chunks:
            if chunk.strip() == "":
                continue
            vector = embeddings(model="bge-m3", prompt=chunk)["embedding"]
            data = {
                "file_name": file_name,
                "folder": folder,
                "text": "",
                "vector": vector,
                "file_ID": ID,
                "verifier": verifier,
                "similarity": 0.0,
                "genai_id": "none",
                "page_num": page_num
            }
            vector_space.append(data)
        print("embedding is done, and the chunks are saved to the database")
    with open(vector_path, "w") as f:
        json.dump(vector_space, f)

def clear_collection():
    with open(Path("/Users","duanegennaro","dIAne","data_base","vector_space.json"), "w") as f:
        json.dump([], f)
    print("cleared the collection")

def pool_vectors(promtp, database_name, num_vectors=20):
    closest = []
    with open(Path("/Users","duanegennaro","dIAne","data_base",database_name,"vector_space.json"), "r") as f:
        vector_space = json.load(f)

        for element in vector_space:
            vec_a = np.array(element["vector"])
            vec_b = np.array(promtp)
            cosine_similarity = np.dot(vec_a, vec_b) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_b))
            element["similarity"] = cosine_similarity
        
            if len(closest) == 0:
                closest.append(element)
            else:
                for i in range(len(closest)):
                    if closest[i]["similarity"] < cosine_similarity:
                        closest.insert(i, element)
                        break
                if len(closest) < num_vectors:
                    closest.append(element)

                if len(closest) > num_vectors:
                    closest = closest[:num_vectors]

    print("found", len(closest), "vectors")
    return closest

def pull_files(top_hits, database_name):
    files = []
    doc = []

    for hit in top_hits:
        if hit['folder'] == 'text_books':
            file_name = hit["file_name"] + "(" + str(hit["page_num"]) + ")"
        else:
            file_name = hit["file_name"]

        score = hit["similarity"]
        genai_id = hit["genai_id"]
        page = hit["page_num"]
        folder = hit["folder"]

        if file_name not in doc:
            files.append({
            "file_name": hit["file_name"],
            "score": score,
            "hits":1,
            "genai_id": genai_id,
            "page_num": page,
            "folder": folder,
            "database_name": database_name
        })
            doc.append(file_name)
        else:
            for i in range(len(files)):
                if files[i]["file_name"] == file_name:
                    files[i]["score"] += score
                    files[i]["hits"] += 1
                    break
        
    return files

def search_vector(promtp,database_name, num_vectors=20):
    vector = embeddings(model="bge-m3", prompt=promtp)["embedding"]
    top_hits = pool_vectors(vector,database_name, num_vectors)
    print("here is a list of the top", num_vectors, "hits:")
    print("--------------------------------------------------")
    for hit in top_hits:
        print(hit["file_name"], "score:", hit["similarity"])

    print("--------------------------------------------------")
    return pull_files(top_hits, database_name)