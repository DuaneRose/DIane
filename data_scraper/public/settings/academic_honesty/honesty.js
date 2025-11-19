async function start_page(){
    console.log("honesty policy page loaded")
    const textarea = document.getElementById('honesty')
    textarea.value = await get_p();

    const save = document.getElementById('save');
    save.addEventListener('click', async () => {
        const new_policy = textarea.value;

        if(new_policy === ""){
            console.log('policy is empty.');
        }else{
            try{
                const folder_name = sessionStorage.getItem('folder_name');
                const resp = await fetch('/api/set_honesty_policy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ honesty_policy: new_policy, folder_name: folder_name })
                });
                if (resp.ok) {
                    console.log('Academic Honesty Policy updated successfully.');
                } else {
                    const errorData = await resp.json();
                    alert(`Error updating policy: ${errorData.error || 'Unknown error'}`);
                }
            }catch(err){
                console.error('Error updating honesty policy:', err);
                alert('Failed to update Academic Honesty Policy.');
            }
        }
    });
} 

async function get_p(){
    try{
        const folder_name = sessionStorage.getItem('folder_name');
        console.log('Fetching honesty policy for folder:', folder_name);
        const resp = await fetch(`/api/get_honesty_policy/${encodeURIComponent(folder_name)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return (await resp.json()).message;
    }catch(err){
        console.error('Error fetching honesty policy:', err);
    }
}

document.addEventListener('DOMContentLoaded', start_page)