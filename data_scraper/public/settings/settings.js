document.addEventListener('DOMContentLoaded', await start_page)

document.getElementById('back_button').onclick = async () => {
    window.location.href = '/api/chat';
}

const menu_options= [
    {"option": "System Promt",
        "html_page": "/static/settings/systemp/system_prompt.html",
        "authorized_roles": "admin"
    },{"option": "Text Book",
        "html_page": "/static/settings/textb/text_book.html",
        "authorized_roles": "admin"
    },{"option": "Honesty Policy",
        "html_page": "/static/settings/academic_honesty/honesty.html",
        "authorized_roles": "admin"
    },{"option": "Syllabus",
        "html_page": "/static/settings/syllabus/syllabus.html",
        "authorized_roles": "admin"
    },{"option": "Files",
        "html_page": "/static/settings/files/files.html",
        "authorized_roles": "admin"
    },{"option": "Join Code",
        "html_page": "/static/settings/join_code/join_code.html",
        "authorized_roles": "admin"
    }
]

async function start_page(){
    create_menu(await user_type());
}

async function user_type(){
    const user_id = sessionStorage.getItem("user_id");
    const res =  await fetch(`/api/security/get_user_type/${encodeURIComponent(user_id)}`);
    const data = await res.json();
    return data.user_type;
}

function create_menu(user_type){
    console.log("menu options function")
    const bar = document.getElementById("menu_bar")
    for (let i = 0; i < menu_options.length; i++) {
        if (menu_options[i].authorized_roles !== user_type){
            console.log(`Skipping option: ${menu_options[i].option} for user type: ${user_type}`);
            continue;
        }else{
            const option = menu_options[i];
            const button = document.createElement("p");
            button.innerText = option.option;
            button.className = "menu_button";
            button.onclick = function() {
                handle_menu_option(option.option);
            };
            bar.appendChild(button);
            bar.appendChild(document.createElement("hr"));
        }
    }
    bar.lastChild.remove();
}

function handle_menu_option(option){
    console.log(`Menu option selected: ${option}`);
    const html_page = menu_options.find(opt => opt.option === option)?.html_page;
    console.log(`Navigating to: ${html_page}`);
    
    const el = document.getElementById("window");

    const iframe = document.createElement("iframe");
    iframe.src = html_page;
    iframe.title = "Embedded page";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";

    el.replaceChildren(iframe);
}
