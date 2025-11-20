async function start_page(){
    console.log("syllabus page loaded")
    const textarea = document.getElementById('syllabus')
    textarea.value = await get_s();

    const save = document.getElementById('save');
    save.addEventListener('click', async () => {
        const new_syllabus = textarea.value;

        if(new_syllabus === ""){
            console.log('syllabus is empty.');
        }else{
            try{
                const database_name = sessionStorage.getItem('database_name');
                console.log('Updating syllabus for folder:', database_name);
                const resp = await fetch('/api/set_syllabus', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ syllabus: new_syllabus, database_name: database_name })
                });
                if (resp.ok) {
                    console.log('syllabus updated successfully.');
                } else {
                    const errorData = await resp.json();
                    alert(`Error updating syllabus: ${errorData.error || 'Unknown error'}`);
                }
            }catch(err){
                console.error('Error updating syllabus:', err);
                alert('Failed to update syllabus.');
            }
        }
    });
} 

async function get_s(){
    try{
        const database_name = sessionStorage.getItem('database_name');
        console.log('Fetching syllabus for folder:', database_name);
        const resp = await fetch(`/api/get_syllabus/${encodeURIComponent(database_name)}`, {
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