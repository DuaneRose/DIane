from pathlib import Path

def get_instruction(name, folder_name):
    print(name)
    if name == "default":
        print("Using default system instruction.")
        return get_default_instruction()
    elif name == "custom":
        print("Using custom system instruction.")
        return get_custom_instruction(folder_name)
    elif name == "guided":
        print("Using guided system instruction.")
        return get_guided_instruction()
    elif name == "direct":
        print("Using direct system instruction.")
        return get_direct_instruction()
    else:
        raise ValueError(f"Unknown system instruction: {name}")
    
def get_guided_instruction():
    with open(Path("/Users","duanegennaro","dIAne","RAG","system", "system_instruction", "guided.txt"), "r") as file:
        return file.read()
    
def get_custom_instruction(folder_name):
    with open(Path("/Users","duanegennaro","dIAne","data_base",folder_name, "custom_system.txt"), "r") as file:
        return file.read()
    
def get_direct_instruction():
    with open(Path("/Users","duanegennaro","dIAne","RAG","system", "system_instruction", "direct.txt"), "r") as file:
        return file.read()
    
def get_default_instruction():
    with open(Path("/Users","duanegennaro","dIAne","RAG","system", "system_instruction", "default.txt"), "r") as file:
        return file.read()

def get_all_instructions():
    print("Retrieving all system instructions.")
    return {
        "default": get_default_instruction(),
        "custom": get_custom_instruction(),
        "guided": get_guided_instruction(),
        "direct": get_direct_instruction()
    }

def write_custom_instruction(content, folder_name):
    with open(Path("/Users","duanegennaro","dIAne","data_base",folder_name, "custom_system.txt"), "w") as file:
        file.write(content)
    print("Custom system instruction updated.")