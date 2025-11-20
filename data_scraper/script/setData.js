import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { htmlToText } from 'html-to-text';
import isEqual from 'lodash.isequal';
import { re } from 'mathjs';
// import { create } from 'lodash';
// import { re } from 'mathjs';
// import { error } from 'console';
// import { get } from 'lodash';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


//const policy = path.join(__dirname, '../../data_base/academic_honesty.txt');
const token = '10082~rvBhVXGEuCrMnmL9YDBeCVLLPwUKvLrYMewtLtwFyWzN4nufWXFVQFmJWYQ9JRvP';
const canvas = 'https://sdsu.instructure.com/api/v1/courses/'
let fileURL = [];

export async function run(ID, file_name){
    try {
        await create_db(ID, file_name);
        console.log('Both operations completed successfully');
    } catch (error) {
        console.error('Error in run:', error);
    }
    console.log("double checking that we have all the files");
    await check_folders(ID);
    console.log("pulling files");
    await pull_files(file_name);
}

async function create_db(courseID, file_name){
    const db = path.join(__dirname, `../../data_base/${file_name}/db.json`);
    const data = {
        "assignments": await assignments(courseID),
        "modules": await modules(courseID),
        "syllabus": await get_syllabus(courseID),
        "announcements": await only_announcements(courseID),
        "academic_honesty_policy": await get_default_honesty_policy()
    }

    await fs.writeFile(db, JSON.stringify(data, null, 2));
}

async function assignments(courseID) {
    const work = []
    const {data} = await axios.get(`${canvas}${courseID}/assignments`,
        {
            headers: {'Authorization': `Bearer ${token}`}
        }
    );

    for( let i = 0; i < data.length; i++){
        const info = {
            "name":data[i].name,
            "id":data[i].id,
            "description":data[i].description,
            "points_possible":data[i].points_possible,
            "grading_type":data[i].grading_type,
            "submission_types":data[i].submission_types,
            "due_at":data[i].due_at,
            "has_submitted_submissions":data[i].has_submitted_submissions,
            "published":data[i].published,
            "visible_to_everyone":data[i].visible_to_everyone,
        }

        work.push(info);
    }

    return work;
}

async function get_syllabus(courseID){
    try{
        const {data} = await axios.get(`${canvas}${courseID}?include[]=syllabus_body`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );


        const syllabusText = htmlToText(data.syllabus_body, {
            wordwrap: 100,
            selectors: [
              { selector: 'a', options: { ignoreHref: true } }
            ]
          });
          
        
        return syllabusText;
    }catch(error) {
        console.error('Error fetching syllabus:', error);
    }

    return 'no syllabus found';
}

async function modules(courseID){

    try{
        const {data} = await axios.get(`${canvas}${courseID}/modules`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );
        for(let i = 0; i < data.length; i++){
            let mod = await modulesData(data[i].items_url);
            data[i].items_url = mod;
            data[i].items = data[i].items_url;
            delete data[i].items_url;

            for(let j = 0; j < mod.length; j++){
                if(mod[j].type === 'File'){
                    let file = mod[j].url;

                    const { data: meta } = await axios.get(file, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                
                    const rawLink   = meta.download_url || meta.url;

                    if(file && !fileURL.some(pair => isEqual(pair, [rawLink, meta.display_name]))) {
                        fileURL.push([rawLink,meta.display_name]);
                    }
                }
            }
        }
        return data;
    }catch(error) {
        console.error('Error fetching module data:', error);
    }
}

async function only_announcements(courseID){
    try{
        const {data} = await axios.get(`${canvas}${courseID}/discussion_topics?only_announcements=true`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );

        const announcements = data.map(discussion => ({
            title: discussion.title,
            message: htmlToText(discussion.message, {
                wordwrap: 130,
                selectors: [
                    { selector: 'a', options: { ignoreHref: true } }
                ]
            })
        }));

        return announcements;
    }catch(error) {
        console.error('Error fetching announcements:', error);
    }
}

async function modulesData(items_url) {
    try{
        const {data} = await axios.get(items_url,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );
        return data;
    }catch(error) {
        console.error('Error fetching module data:', error);
    }
}

async function add_files(url){
    console.log(`looking for files in ${url}`);
    try {
        const { data } = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`found ${data.length} poptenial files`);
        for (const file of data) {
            if (file.url && !fileURL.some(pair => isEqual(pair, [file.url, file.display_name]))) {
                fileURL.push([file.url,file.display_name]);
            }
        }
    } catch (error) {
        console.error(`Error fetching files from ${url}:`, error);
    }
}

async function inspect_folder(folder_url){
    const {data} = await axios.get(folder_url,
        {
            headers: {'Authorization': `Bearer ${token}`}
        }
    );

    for( const folder of data) {
        if(folder.folders_count > 0){
            console.log(`Inspecting folder: ${folder.name}`);
            await inspect_folder(`${folder.folders_url}?per_page=100`);
        }else if(folder.files_count > 0){
            await add_files(`${folder.files_url}?per_page=100`);
        }
    }
}

async function check_folders(courseID){
    const {data} = await axios.get(`${canvas}${courseID}/folders`,
        {
            headers: {'Authorization': `Bearer ${token}`}
        }
    );

    console.log(`looking through ${data.length} folders`);
    for( const folder of data) {
        if(folder.folders_count > 0 && folder.name !== 'course files'){
            console.log(`Inspecting folder: ${folder.name}`);
            await inspect_folder(`${folder.folders_url}?per_page=100`);
        }else if(folder.files_count > 0){
            console.log(`${folder.name} has ${folder.files_count} files`);
            await add_files(`${folder.files_url}?per_page=100`);
        }    
    }
}

async function pull_files(file_name){
    console.log(fileURL.length);
    let num = 1;
    for (const apiUrl of fileURL) {
        console.log(`Processing file: ${apiUrl[1]}`);
        if(apiUrl[1].includes('.mp4'))
            console.log("skipping video file");
        else{
            try {
                const joiner = apiUrl[0].includes('?') ? '&' : '?';
                const downloadUrl = `${apiUrl[0]}${joiner}access_token=${token}`;
            
                const fileRes = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    maxRedirects: 5
                });
            
                const ct = fileRes.headers['content-type'] ?? '';
                if (ct.startsWith('text/html') || ct.startsWith('application/json')) {
                    throw new Error(`Expected binary but got ${ct}`);
                }
            
                const target = path.join(__dirname, `../../data_base/${file_name}/canvas_data`, apiUrl[1]);
                await fs.writeFile(target, fileRes.data);
                console.log(`${num}.) ✅  Saved ${apiUrl[1]}`);
    
                await axios.post('http://localhost:4500/api/embed', {
                    name: apiUrl[1],
                    raw_link: apiUrl[0],
                    database_name: file_name
                })
                console.log(`✅  Embedded ${apiUrl[1]}`);
    
                } catch (err) {
                console.error(`❌  ${apiUrl}: ${err.message}`);
            }
            num++;
        }
    }
}

async function change_honesty_policy(policy, database_name){
    const db = path.join(__dirname, `../../data_base/${database_name}/db.json`);
    console.log("changing honesty policy:\n");
    const data = await fs.readFile(db, 'utf8');
    const parsedData = JSON.parse(data);
    parsedData.academic_honesty_policy = policy;
    await fs.writeFile(db, JSON.stringify(parsedData, null, 2));
}

async function get_default_honesty_policy(database_name){
    const policy = path.join(__dirname, `../../data_base/${database_name}/academic_honesty.txt`);
    const data = await fs.readFile(policy, 'utf8');
    return data;
}

async function Honesty_policy(file_name){
    const db = path.join(__dirname, `../../data_base/${file_name}/db.json`);
    const data = await fs.readFile(db, 'utf8');
    const parsed_data = JSON.parse(data);
    const data_policy = parsed_data.academic_honesty_policy;
    return data_policy;
}

async function change_syllabus(syllabus, database_name){
    const db = path.join(__dirname, `../../data_base/${database_name}/db.json`);
    const data = await fs.readFile(db, 'utf8');
    const parsedData = JSON.parse(data);
    parsedData.syllabus = syllabus;
    await fs.writeFile(db, JSON.stringify(parsedData, null, 2));
}

async function syllabus(database_name){
    const db = path.join(__dirname, `../../data_base/${database_name}/db.json`);
    const data = await fs.readFile(db, 'utf8');
    const parsed_data = JSON.parse(data);
    const syllabus = parsed_data.syllabus;
    return syllabus;
}

function erase_data(){
    const folder = path.join(__dirname, '../../data_base/canvas_data');
    const folder1 = path.join(__dirname, '../../data_base/text_books');

    fs.readdir(folder)
        .then(files => {
            files.forEach(file => {
                const filePath = path.join(folder, file);
                fs.unlink(filePath)
                    .then(() => console.log(`Deleted ${file}`))
                    .catch(err => console.error(`Error deleting ${file}:`, err));
            });
        })
        .catch(err => console.error('Error reading directory:', err));

    fs.readdir(folder1)
        .then(files => {
            files.forEach(file => {
                const filePath = path.join(folder1, file);
                fs.unlink(filePath)
                    .then(() => console.log(`Deleted ${file}`))
                    .catch(err => console.error(`Error deleting ${file}:`, err));
            });
        })
        .catch(err => console.error('Error reading directory:', err));
    fileURL.length = 0;
}

function ID_generator (size=8){
    let ID = ""

    const caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lower = "abcdefghijklmnopqrstuvwxyz"
    const num = "1234567890"
    const unique = "!@#$&*+~?<>.,;:{}[]()-_=|"

    const chars = caps + lower + num + unique
    const max = chars.length

    for(let i = 0; i < size; i ++){
        const x = Math.floor(Math.random() * max)

        ID += chars.charAt(x)
    }

    return ID
}

function find_id(username, array){
    for(const users of array){
        if (users.username === username){
            return [users.ID, users.database_name, users.user_type];
        }
    }
    return "N/A"
}

async function initialize_class(canvas_ID, user_ID) {
    const {data} = await axios.get(`${canvas}${canvas_ID}`,
        {
            headers: {'Authorization': `Bearer ${token}`}
        }
    );

    const class_name = data.name;
    
    const code = ID_generator(10);
    const name = await create_class(class_name, code, user_ID);
    await fill_class(name, canvas_ID);
    return name;
}

async function fill_class(class_name, Class_code){
    await run(Class_code, class_name);
}

async function create_class(class_name, Class_code, user_ID){
    const name = `${class_name.replace(/\s+/g, "_").toLowerCase()}-${Class_code}`
    const database_name = path.join(
        __dirname,
        "../../data_base",
        name
      );
    const canvas_data_folder = path.join(database_name, "canvas_data");
    const conversation_folder = path.join(database_name, "conversations");
    const signatures_folder = path.join(database_name, "signatures");
    const text_books_folder = path.join(database_name, "text_books");
    const db = path.join(database_name, "db.json");
    const vector_space = path.join(database_name, "vector_space.json");
    const users = path.join(database_name, "users.json");
    const initialize = [];
    const jsonInit = JSON.stringify(initialize, null, 2);
    const empty_obj = {};
    const objInit = JSON.stringify(empty_obj, null, 2);
    const custom_system = path.join(database_name, "custom_system.txt");

    try {
        await fs.mkdir(database_name, { recursive: true });
        console.log('Folder created successfully!');
        await fs.mkdir(canvas_data_folder, { recursive: true });
        await fs.mkdir(conversation_folder, { recursive: true });
        await fs.mkdir(signatures_folder, { recursive: true });
        await fs.mkdir(text_books_folder, { recursive: true });
        await fs.writeFile(db, objInit);
        await fs.writeFile(vector_space, jsonInit);
        await fs.writeFile(users, jsonInit);
        await fs.writeFile(custom_system, '');
      } catch (err) {
        if (err.code === 'EEXIST') {
          console.log('Folder already exists.');
        } else {
          console.error('Error creating folder:', err);
        }
      }

    return name;
}

async function validate_canvas_code(code){
    try{
        const {data} = await axios.get(`${canvas}${code}`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );
        console.log("valid canvas code for course:", data.name);
        return true;
    }catch(error) {
        console.error('Error validating canvas code:', code);
        return false;
    }
}

export default {run, erase_data, change_honesty_policy, Honesty_policy, change_syllabus, syllabus, ID_generator, find_id,get_default_honesty_policy,initialize_class, validate_canvas_code};
