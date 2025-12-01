const name_input = document.getElementById("username");
const pass_input = document.getElementById("password");

const submit_button = document.getElementById("send_button");
const sign_up = document.getElementById("sign-up");
const error_message = document.getElementById("error");

document.addEventListener("DOMContentLoaded", async (e) =>{
    const ID = sessionStorage.getItem('user_id');
    if(ID){
        const res = await fetch(`/api/security/quick_sign_in/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: ID })
        });
        const response = await res.json();
        if (res.ok) {
            sessionStorage.setItem('user_id', response.user_id);
            sessionStorage.setItem('database_name', response.database_name);
            sessionStorage.setItem('user_type', response.user_type);
            window.location.href = "/api/chat";
        }
    }
});

submit_button.addEventListener("click", async (e) => {
    e.preventDefault();
    await sign_in()
});

async function sign_in(){
    error_message.innerText = "";

    const name = name_input.value;
    const pass = pass_input.value;

    const response = await fetch("/api/security/sign_in", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: name, password: pass })
    });

    const result = await response.json();
    

    if (response.ok) {
        sessionStorage.setItem('user_id', result.user_id);
        sessionStorage.setItem('database_name', result.database_name);
        sessionStorage.setItem('user_type', result.user_type);
        window.location.href = "/api/chat";
    } else {
        error_message.innerText = result.message || "An error occurred during sign up.";
    }
}

document.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
        e.preventDefault();
        await sign_in()
    } 
});

sign_up.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/api/sign_up";
});