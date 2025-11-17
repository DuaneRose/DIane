const join = document.getElementById("join");
const create = document.getElementById("create");


const sign_in = document.getElementById("sign-in");


document.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
        e.preventDefault();
        await sign_up()
    } 
});

sign_in.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/api/sign_in";
});

join.addEventListener("click", async (e) => {
    e.preventDefault();
    window.location.href = "/api/join";
});

create.addEventListener("click", async (e) => {
    e.preventDefault();
    window.location.href = "/api/create";
});