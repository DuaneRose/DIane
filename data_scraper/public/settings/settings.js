document.addEventListener('DOMContentLoaded', start_page)

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
        "authorized_roles": "user"
    },{"option": "Syllabus",
        "html_page": "/static/settings/syllabus/syllabus.html",
        "authorized_roles": "user"
    },{"option": "Files",
        "html_page": "/static/settings/files/files.html",
        "authorized_roles": "user"
    }
]

function start_page(){
    create_menu();
}

function create_menu(){
    console.log("menu options function")
    const bar = document.getElementById("menu_bar")
    for (let i = 0; i < menu_options.length; i++) {
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
