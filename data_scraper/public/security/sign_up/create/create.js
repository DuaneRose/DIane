const name_input = document.getElementById("username");
const pass_input = document.getElementById("password");
const confirm_pass_input = document.getElementById("password_double");
const canvas_code_input = document.getElementById("class_code");

const submit_button = document.getElementById("send_button");
const back = document.getElementById("back");
const error_message = document.getElementById("error");

submit_button.addEventListener("click", async (e) => {
    e.preventDefault();
    await sign_up()
});

async function sign_up(){
    error_message.innerText = "";

    const name = name_input.value;
    const pass = pass_input.value;
    const confirm_pass = confirm_pass_input.value;
    const code = canvas_code_input.value;

    if (name.length < 5) {
        error_message.innerText = "Username must be at least 5 characters long.";
        return;
    }

    if (pass.length < 6) {
        error_message.innerText = "Password must be at least 6 characters long.";
        return;
    }

    if (pass !== confirm_pass) {
        error_message.innerText = "Passwords do not match.";
        return;
    }

    const validate_res = await fetch(`/api/valid_canvas_code/code=${code}`);
    const validate_data = await validate_res.json();
    console.log(validate_data.valid)
    if (!validate_res.ok || !validate_data.valid) {
        error_message.innerText = "Invalid Canvas class code.";
        return;
    }

    const res = await fetch("/api/create_class",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ canvas_code: code })
    })

    const folder_name = await res.json()
    console.log(folder_name)

    const response = await fetch("/api/security/sign_up", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: name, password: pass, user_type: "adimin", folder_name: folder_name.folder_name})
    });

    const result = await response.json();
    

    if (response.ok) {
        window.location.href = "/api/sign_in";
    } else {
        error_message.innerText = result.message || "An error occurred during sign up.";
    }
}

document.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
        e.preventDefault();
        await sign_up()
    } 
});

back.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/api/sign_up";
});