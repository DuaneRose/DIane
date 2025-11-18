//ngrok http 4500
//bundle exec script/delayed_job start bundle 
// exec rails server

import cors from "cors";
import express from 'express';
import session from 'express-session';
import pkg from 'ims-lti';
import path from 'path';
import { fileURLToPath } from 'url';
import setData from './script/setData.js';
import fs from 'fs/promises';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = path.join(__dirname, '../data_base/db.json');
const UPLOAD_DIR_BOOKS = path.join(__dirname, '../data_base/text_books');
const UPLOAD_DIR_FILES = path.join(__dirname, '../data_base/canvas_data');

const app = express();
const PORT = process.env.PORT || 4500;
let ID = 163398;
const CONSUMER_KEY = 'key123';
const CONSUMER_SECRET = 'secret123';
const { Provider } = pkg;

app.set('trust proxy', true);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CSP headers for Canvas iframe compatibility
app.use((req, res, next) => {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host  = (req.headers['x-forwarded-host']  || req.headers.host || '').split(',')[0].trim();
  const selfHost = `${proto}://${host}`;
  res.locals.baseUrl = selfHost;

  res.setHeader('Content-Security-Policy', [
    `default-src 'self' ${selfHost} https:`,
    `img-src 'self' ${selfHost} https: data:`,
    `style-src 'self' ${selfHost} https: 'unsafe-inline'`,
    `script-src 'self' ${selfHost} https: 'unsafe-inline' https://cdn.jsdelivr.net`,
    `font-src 'self' ${selfHost} https: data:`,
    `connect-src 'self' ${selfHost} https:`,
    "frame-ancestors 'self' http://localhost:3000 https://*.instructure.com http://*.instructure.com"
  ].join('; '));

  res.removeHeader('X-Frame-Options');
  next();
});

// CORS headers for static resources
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Static file serving with proper MIME types
app.use('/static', express.static(
  path.join(__dirname, 'public'),
  {
    setHeaders(res, filePath) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }
));
app.use('/files', express.static(UPLOAD_DIR_BOOKS));

// Cookie partitioning for third-party iframe context
app.use((req, res, next) => {
  const orig = res.setHeader;
  res.setHeader = function (name, value) {
    if (name && typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
      const arr = Array.isArray(value) ? value : [value];
      value = arr.map(v => /;\s*Partitioned\b/i.test(v) ? v : v + '; Partitioned');
    }
    return orig.call(this, name, value);
  };
  next();
});

// Session configuration for Canvas iframe (CHIPS)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true
  }
}));

app.use((req, res, next) => {
  res.append('Set-Cookie', 'tool_part=1; Path=/; Secure; SameSite=None; Partitioned');
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } 
});

function sanitize(base) {
  return base.replace(/[^\w.-]/g, '_');
}

async function writeUniqueFile(dir, originalName, buffer) {
  const { name, ext } = path.parse(sanitize(originalName));
  for (let i = 0; i < 1000; i++) {
    const fname = i === 0 ? `${name}${ext}` : `${name} (${i})${ext}`;
    const fpath = path.join(dir, fname);
    try {
      await fs.writeFile(fpath, buffer, { flag: 'wx' });
      return { filename: fname, filePath: fpath };
    } catch (err) {
      if (err.code === 'EEXIST') continue;
      throw err;
    }
  }
  throw new Error('Could not allocate a unique filename after many attempts');
}

// Routes
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security','sign_in', 'sign_in.html'));
});

app.get('/api/sign_in', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security','sign_in', 'sign_in.html'));
});

app.get('/api/sign_up', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security','sign_up', 'sign_up.html'));
});

app.get('/api/create', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security','sign_up', 'create', 'create.html'));
});

app.get('/api/join', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security','sign_up', 'join', 'join.html'));
});

app.get('/api/chat', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat_page', 'chat.html'));
});

app.get('/api/settings', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings', 'settings.html'));
});

app.post('/api/get_data', async (req, res) =>{
  ID = req.body.query;
  console.log(`Fetching Canvas data for course ID: ${ID}`);
  await setData.run(ID);
  console.log('✅ Canvas data fetched successfully');
  res.json({ message: `Data fetched for ID: ${ID}` });
})

app.post('/api/erase_data', async (req, res) => {
  console.log('Erasing all course data');
  try{
    await fs.writeFile(db, '{"data": "empty"}');
    ID = 0;
    setData.erase_data();
    await fetch(`http://localhost:4600/reset/`);
    console.log('✅ All data erased');
    res.json({ message: 'Data erased successfully' });
  }catch(error) {
    console.error('❌ Error erasing data:', error);
    res.status(500).json({ error: 'Failed to erase data' });
  }
})

app.post('/api/is_data', async (req, res) => {
  const data = await fs.readFile(db, 'utf8');
  if(data === '{"data": "empty"}'){
    res.json({ message: 'Data is empty', status: 'empty' });
  } else {
    res.json({ message: 'Data is not empty', status: 'not_empty' });
  }
})

app.post('/api/embed', async (req, res) =>{
  const file = req.body.name;
  const raw_link = req.body.raw_link;
  const ID = raw_link.substr(raw_link.indexOf("files/") + 6, (raw_link.indexOf("/download") - (raw_link.indexOf("files/") + 6)));
  const verifier = raw_link.substr(raw_link.indexOf("verifier=") + 9);

  console.log(`Embedding Canvas file: ${file}`);
  res.json({ message: `File ${file} is being embedded`, status: 'success' });
  
  try {
    await fetch(`http://localhost:4600/embed/${file}/canvas_data/${ID}/${verifier}`);
    console.log(`✅ File embedded: ${file}`);
  } catch (error) {
    console.error('❌ Error embedding file:', error);
  }
});

app.get('/lti/launch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat_page', 'chat.html'));
});

app.post('/lti/launch', (req, res) => {
  const provider = new Provider(CONSUMER_KEY, CONSUMER_SECRET);

  provider.valid_request(req, (err, isValid) => {
    if (err || !isValid) {
      console.error('❌ LTI validation failed');
      return res.status(401).send('Invalid LTI launch');
    }

    req.session.user_id = provider.body.user_id;
    req.session.context_id = provider.body.context_id;

    console.log(`✅ LTI launch successful - User: ${provider.body.user_id}`);
    
    const htmlPath = path.join(__dirname, 'public', 'security', 'sign_in', 'sign_in.html');
    fs.readFile(htmlPath, 'utf8').then(html => {
      const modifiedHtml = html
        .replace(/href="\/static\//g, `href="${res.locals.baseUrl}/static/`)
        .replace(/src="\/static\//g, `src="${res.locals.baseUrl}/static/`);
      
      res.send(modifiedHtml);
    }).catch(err => {
      console.error('❌ Error reading HTML:', err);
      res.status(500).send('Error loading page');
    });
  });
});

app.get('/whoami', (req, res) => {
  res.json({ user: req.session.user_id, course: req.session.context_id });
});

app.get('/lti_config.xml', async (req, res) => {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const launchUrl = `${proto}://${host}/lti/launch`;
  
  try {
    // Read the existing XML file
    const xmlPath = path.join(__dirname, 'public', 'lti_config.xml');
    let xmlContent = await fs.readFile(xmlPath, 'utf8');
    
    // Replace the launch URL with the current ngrok URL
    xmlContent = xmlContent.replace(
      /<blti:launch_url>.*?<\/blti:launch_url>/,
      `<blti:launch_url>${launchUrl}</blti:launch_url>`
    );
    
    console.log(`LTI config requested - Launch URL: ${launchUrl}`);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlContent);
  } catch (err) {
    console.error('❌ Error reading LTI config:', err);
    res.status(500).send('Error loading LTI configuration');
  }
});

app.post('/api/query/:user_id', async (req, res) => {
  const { query } = req.body;
  const { user_id } = req.params;
  console.log(`💬 Processing query: "${query}"`);

  try {
    const pyRes = await fetch(`http://localhost:4600/question/${query}`);
    const message = await pyRes.text();
    const clean = JSON.parse(message);

    const formatted = clean
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    const logs = await fs.readFile(path.join(__dirname, `../data_base/conversation/${user_id}.json`), 'utf8');
    const chat_logs = JSON.parse(logs);
    
    chat_logs.push({ question: query, answer: formatted, timestamp: new Date().toISOString() });
    await fs.writeFile(path.join(__dirname, `../data_base/conversation/${user_id}.json`), JSON.stringify(chat_logs, null, 2));

    console.log('✅ Query processed and saved');
    res.json({ message: message, status: 'success' });
  } catch (error) {
    console.error('❌ Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

app.get('/api/system_instructions', async (req, res) => {
  const name = (req.query?.name ?? 'default');
  try {
    const r = await fetch(`http://localhost:4600/get_instruction/${encodeURIComponent(name)}`);
    if (!r.ok) return res.status(r.status).send(await r.text());
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error('❌ Error fetching system instructions:', err);
    return res.status(502).json({ error: 'Failed to fetch system instructions' });
  }
});

app.post('/api/set_custom_instruction', async (req, res) => {
  const { name, instructions } = req.body || {};
  console.log(`✏️  Setting custom instruction: ${name}`);
  try {
    const r = await fetch('http://localhost:4600/set_custom_instruction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, instructions })
    });
    if (!r.ok) return res.status(r.status).send(await r.text());
    console.log('✅ Custom instruction saved');
    res.json(await r.json());
  } catch (err) {
    console.error('❌ Error setting custom instruction:', err);
    res.status(502).json({ error: 'Failed to set custom instruction' });
  }
});

app.get('/api/get_mode', async (req, res) => {
  try {
    const r = await fetch('http://localhost:4600/get_mode');
    if (!r.ok) return res.status(r.status).send(await r.text());
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error('❌ Error fetching mode:', err);
    return res.status(502).json({ error: 'Failed to fetch mode' });
  }
});

app.post('/api/set_mode', async (req, res) => {
  const mode = req.body?.mode ?? 'default';
  console.log(`Setting mode: ${mode}`);
  try {
    const r = await fetch(`http://localhost:4600/set_mode/${encodeURIComponent(mode)}`, {
      method: 'POST'
    });
    if (!r.ok) return res.status(r.status).send(await r.text());
    console.log('✅ Mode updated');
    res.json(await r.json());
  } catch (err) {
    console.error('❌ Error setting mode:', err);
    res.status(502).json({ error: 'Failed to set mode' });
  }
});

app.get('/api/get_syllabus', async (req, res) =>{
  const data = await fs.readFile(db, 'utf8');
  if(data === '{"data": "empty"}'){
    res.json({message: "no class enrolled in"});
  } else {
    const syllabus = await setData.syllabus();
    res.json({message: syllabus});
  }
});

app.post('/api/set_syllabus', async (req, res) =>{
  const { syllabus } = req.body || {};
  console.log('Updating syllabus');
  try {
    await setData.change_syllabus(syllabus);
    console.log('✅ Syllabus updated');
    res.json({ message: 'Syllabus updated successfully' });
  } catch (err) {
    console.error('❌ Error setting syllabus:', err);
    res.status(500).json({ error: 'Failed to set syllabus' });
  }
});

app.get('/api/get_honesty_policy', async (req, res) =>{
  const data = await fs.readFile(db, 'utf8');
  if(data === '{"data": "empty"}'){
    let honesty_policy = await setData.get_default_honesty_policy();
    res.json({message: honesty_policy});
  } else {
    let honesty_policy = await setData.Honesty_policy();
    res.json({message: honesty_policy});
  }
});

app.post('/api/set_honesty_policy', async (req, res) =>{
  const { honesty_policy } = req.body;
  console.log('Updating honesty policy');
  try {
    await setData.change_honesty_policy(honesty_policy);
    console.log('✅ Honesty policy updated');
    res.json({ message: 'Honesty policy updated successfully' });
  } catch (err) {
    console.error('❌ Error setting honesty policy:', err);
    res.status(500).json({ error: 'Failed to set honesty policy' });
  }
});

app.post('/api/upload_book', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    console.log(`Uploading file: ${req.file.originalname}`);
    await fs.mkdir(UPLOAD_DIR_BOOKS, { recursive: true });

    const { filename, filePath } = await writeUniqueFile(
      UPLOAD_DIR_BOOKS,
      req.file.originalname,
      req.file.buffer
    );

    try {
      await fetch(`http://localhost:4600/embed/${filename}/text_books/${1111111}/${'none'}`);
      console.log(`✅ File uploaded and embedded: ${filename}`);
    } catch (error) {
      console.error('❌ Error embedding file:', error);
    }

    return res.json({
      ok: true,
      filename,
      path: filePath,
      url: `/files/${encodeURIComponent(filename)}`
    });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.post('/api/upload_file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    console.log(`📤 Uploading file: ${req.file.originalname}`);
    await fs.mkdir(UPLOAD_DIR_FILES, { recursive: true });

    const { filename, filePath } = await writeUniqueFile(
      UPLOAD_DIR_FILES,
      req.file.originalname,
      req.file.buffer
    );

    try {
      await axios.post('http://localhost:4600/api/embed', {
        name: filename,
        raw_link: "N/A",
    })
      console.log(`✅ File uploaded and embedded: ${filename}`);
    } catch (error) {
      console.error('❌ Error embedding file:', error);
    }

    return res.json({
      ok: true,
      filename,
      path: filePath,
      url: `/files/${encodeURIComponent(filename)}`
    });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.post('/api/security/sign_up', async (req, res) => {
  const { username, password, user_type, folder_name } = req.body;

  try {
    const usersData = await fs.readFile(path.join(__dirname, '../data_base/users.json'), 'utf8');
    const users = JSON.parse(usersData);

    if (users.find(user => user.username === username)) {
      console.log(`Sign-up failed: username "${username}" already exists`);
      return res.status(409).json({ message: 'Username already exists.' });
    }

    console.log(`Registering new user: ${username}`);
    const ID = setData.ID_generator(8);
    users.push({ username, password, 'ID': ID, user_type, folder_name});

    await fs.writeFile(path.join(__dirname, `../data_base/conversation/${ID}.json`), JSON.stringify([], null, 2));
    await fs.writeFile(path.join(__dirname, '../data_base/users.json'), JSON.stringify(users, null, 2));

    console.log('✅ User registered successfully');
    res.status(201).json({ message: 'User registered successfully.', user_id: ID });
  } catch (error) {
    console.error('❌ Error during sign up:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/security/sign_in', async (req, res) => {
  const { username, password } = req.body;

  try {
    const usersData = await fs.readFile(path.join(__dirname, '../data_base/users.json'), 'utf8');
    const users = JSON.parse(usersData);

    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
      const data = setData.find_id(username, users);
      console.log(`✅ User signed in: ${username}`);
      return res.status(200).json({ message: 'Sign in successful.', user_id: data[0], folder_name: data[1], user_type: data[2] });
    } else {
      console.log(`⚠️  Sign-in failed for username: ${username}`);
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('❌ Error during sign in:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get("/api/chat/get_logs/:user_id", async (req, res) =>{
  const { user_id } = req.params;
  console.log(`Fetching chat logs for user ID: ${user_id}`);
  const logs = await fs.readFile(path.join(__dirname, `../data_base/conversation/${user_id}.json`), 'utf8');
  const chat_logs = JSON.parse(logs);

  return res.json({
    logs: chat_logs,
    status: 'success'
  });
});

app.get("/api/book_list", async (req, res) =>{
  const folder = path.join(__dirname, '../data_base/text_books');
const list = [];

console.log('Fetching book list from:', folder);

try {
  const files = await fs.readdir(folder);
  
  files.forEach(file => {
    console.log(' - Found file:', file);
    list.push(file);
  });
  
  console.log('✅ Book list fetched:', list);
  
  res.json({
    books: list,
    status: 'success'
  });
} catch (err) {
  console.error('❌ Error reading directory:', err);
  res.status(500).json({
    error: 'Failed to read directory',
    status: 'error'
  });
}
})

app.get("/api/file_list", async (req, res) =>{
  const folder = path.join(__dirname, '../data_base/canvas_data');
const list = [];

console.log('Fetching files list from:', folder);

try {
  const files = await fs.readdir(folder);
  
  files.forEach(file => {
    console.log(' - Found file:', file);
    list.push(file);
  });
  
  console.log('✅ file list fetched:', list);
  
  res.json({
    files: list,
    status: 'success'
  });
} catch (err) {
  console.error('❌ Error reading directory:', err);
  res.status(500).json({
    error: 'Failed to read directory',
    status: 'error'
  });
}
})

app.post('/api/create_class', async (req, res) => {
  const { canvas_code } = req.body;
  try {
    const name = await setData.initialize_class(canvas_code);
    console.log('✅ Class created successfully');
    res.json({ folder_name: name });
  } catch (err) {
    console.error('❌ Error creating class:', err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`Static files: ${path.join(__dirname, 'public')}`);
  console.log(`LTI Consumer Key: ${CONSUMER_KEY}`);
  console.log(`\n✨ Ready for Canvas LTI integration\n`);
});