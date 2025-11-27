const form = document.getElementById('input');
const sign_out = document.getElementById('sign-out');

sign_out.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/api/sign_in";
});

document.getElementById('settings').addEventListener('click', async () => {
    window.location.href = '/api/settings';
});

document.addEventListener("DOMContentLoaded", async (e) =>{
    const message_window = document.getElementById("message_window")

    console.log("here")
    //get all chats and load them in.
    const user_id = sessionStorage.getItem('user_id');
    const database_name = sessionStorage.getItem('database_name');
    const logs = await fetch(`/api/chat/get_logs/${encodeURIComponent(database_name)}/${encodeURIComponent(user_id)}`);
    const info = await logs.json()
    const chat_logs = info.logs

    for(let i = 0; i < chat_logs.length; i++){
        const question = document.createElement('p');
        question.classList.add('query'); 
        question.textContent = chat_logs[i].question;
        message_window.appendChild(question);
        message_window.scrollTop = message_window.scrollHeight; 
        question.scrollIntoView({ behavior: 'smooth', block: 'end' });


        const answer = document.createElement('p');
        answer.classList.add('response');
        answer.innerHTML = chat_logs[i].answer;
        message_window.appendChild(answer);
        message_window.scrollTop = message_window.scrollHeight; 
        answer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
})

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const form_data = new FormData(event.target);
    const q = form_data.get('user_input');

    if(q.includes('//reset') || q.includes('//set')){
        const submit = document.getElementById('send_button');
        submit.disabled = true;
        submit.textContent = 'pulling';
        event.target.reset();
        await reset_data(q);
        submit.disabled = false;
        submit.textContent = 'Send';
    }else{
        console.log(`User asked: ${q}`);
        const submit = document.getElementById('send_button');
        submit.disabled = true;
        submit.textContent = 'Sending';
        displayMessage(q);
        event.target.reset();
        loading();
        await response(q);
        submit.disabled = false;
        submit.textContent = 'Send';
    }
});

async function reset_data(message){
    console.log('ready to delete and/or set data')
    var response = await fetch("/api/is_data", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
    });
    
    const result = await response.json();
    console.log(result.status === 'empty' );
    if(result.status !== 'empty'){
        console.log('resetting data');
        response = await fetch("/api/erase_data", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log("data cleared");
    }else{
        console.log('data already empty');
    }

    if(!message.includes('-done')){
        console.log(message.slice(message.indexOf(' ')+1));
        response = await fetch("/api/get_data", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ query: message.slice(message.indexOf(' ') +1) })
    });
    }
}

function displayMessage(message) {
    const messageContainer = document.getElementById('message_window');
    const messageElement = document.createElement('p');
    messageElement.classList.add('query'); 
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; 
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function response(message){
    const AI = await send_message(message);
    const messageContainer = document.getElementById('message_window');
    const messageElement = document.createElement('p');
    messageElement.classList.add('response');
    const clean = JSON.parse(AI.message);

    const formatted = clean
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       
        .replace(/\*(.*?)\*/g, '<em>$1</em>')                 
        .replace(/`([^`]+)`/g, '<code>$1</code>');              

   
    messageElement.innerHTML = formatted;
    messageContainer.removeChild(messageContainer.lastElementChild);
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; 
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function send_message(message){
    console.log('sending');
    try{
        const user_id = sessionStorage.getItem('user_id');
        const database_name = sessionStorage.getItem('database_name');
        const response = await fetch(`/api/query/${encodeURIComponent(database_name)}/${encodeURIComponent(user_id)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ query: message })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    }catch(error) {
        console.error('Error sending message:', error);
    }
}

function loading(){
    const messageContainer = document.getElementById('message_window');
    const messageElement = document.createElement('p');
    messageElement.classList.add('loading');
    messageElement.textContent = 'Loading';
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; 
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}