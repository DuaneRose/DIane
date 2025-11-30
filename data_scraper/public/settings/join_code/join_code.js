

const code_zone = document.getElementById("code");
const generateBtn = document.getElementById("code-btn");
const list = document.getElementById("students");

document.addEventListener("DOMContentLoaded", async () => {
    const user_id = sessionStorage.getItem("user_id");
    const res = await fetch(`/api/get_join_code/${encodeURIComponent(user_id)}`);
    const data = await res.json();
    code_zone.textContent = data.join_code || "No active join code";
});

generateBtn.addEventListener("click", async () => {
    const checker = sessionStorage.getItem("join_code");
    const class_id = sessionStorage.getItem("database_name");
    if (checker){
        const code = generate();
        const user_id = sessionStorage.getItem("user_id");
        await emidietelyDelete(checker);
        code_zone.textContent = code;
        try{
            const res = await fetch(
            `/api/launch_join_code/${encodeURIComponent(class_id)}/${encodeURIComponent(code)}/${encodeURIComponent(user_id)}`,{
                method: 'POST'
            });
        }catch(err){
            console.error("Error launching join code:", err);
        }
    }else{
        const code = generate();
        const class_id = sessionStorage.getItem("database_name");
        try{
            const res = await fetch(
            `/api/launch_join_code/${encodeURIComponent(class_id)}/${encodeURIComponent(code)}/${encodeURIComponent(user_id)}`,{
                method: 'POST'
            });
            code_zone.textContent = code;

        }catch(err){
            console.error("Error launching join code:", err);
        }
    }
});

function generate (len=8){
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < len; i++) {
        code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return code;
}

async function emidietelyDelete(class_id){
    console.log("Deleting previous join code..." + class_id);
    try{
        const res = await fetch(`/api/delete_join_code/${encodeURIComponent(class_id)}`, {
            method: 'DELETE'
          });    
        sessionStorage.removeItem("join_code");      
    }catch(err){
        console.error("Error launching join code:", err);
    }

}