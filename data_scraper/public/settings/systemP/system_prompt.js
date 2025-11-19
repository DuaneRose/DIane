var location = "default";
var mode = "";

async function start_page() {
    console.log("system prompt page loaded");

    document.querySelectorAll('.mode_select').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.mode || btn.textContent.trim() || "default";
        location = name;
        switch_mode(name);
        system_prompt(name);   
      });
    });

    mode = await get_current_mode();
    console.log(`Current mode: ${mode}`);
    const selected = document.getElementById(`${mode}`);
    if(selected){
        selected.classList.remove('mode_select');
        selected.classList.add('mode_selected');
    } 
}

async function switch_mode(newMode) {
    console.log(`Switching mode to: ${newMode} from ${mode}`);
    const old = document.getElementById(`${mode}`);
    if(old){
        old.classList.remove('mode_selected');
        old.classList.add('mode_select');
    } 

    const swap = document.getElementById(`${newMode}`);
    if(swap){
        swap.classList.remove('mode_select');
        swap.classList.add('mode_selected');
    }
    mode = newMode;

    await fetch('/api/set_mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
    });
}

async function get_current_mode() {
    try {
        const response = await fetch('/api/get_mode');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.mode || 'default';
    } catch (error) {
        console.error('Error fetching current mode:', error);
        return 'default';
    }
}
  
async function system_prompt(name = "default") {
    console.log(`System prompt selected: ${name}`);
    let data = '';
    try {
        const qs = new URLSearchParams({ name }).toString();
        const folder_name = sessionStorage.getItem('folder_name');
        const response = await fetch(`/api/system_instructions/${encodeURIComponent(qs)}/${encodeURIComponent(folder_name)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (error) {
        console.error('Error:', error);
    }

    const content = document.getElementById("content");
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }
    const textarea = document.createElement("textarea");
    textarea.value = data;
    content.appendChild(textarea);
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    content.appendChild(saveButton);
    saveButton.onclick = () => save_prompt(data);
}

async function save_prompt(data) {
    const textarea = document.querySelector("#content textarea");
    const newPrompt = textarea.value;
    if(newPrompt === data) {
        alert('No changes to save.');
        return;
    }else{
        const folder_name = sessionStorage.getItem('folder_name');
        try {
            const response = await fetch('/api/set_custom_instruction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: location, instructions: newPrompt, folder_name: folder_name})
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.error('Error saving prompt:', error);
            alert('Failed to save system prompt.');
        }

        set_custom();
    }
}

async function set_custom(){
    location = "custom";
    await switch_mode("custom");
    system_prompt("custom");
}
  
 
document.addEventListener('DOMContentLoaded', start_page);
  
  