// uploader.js
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const info = document.getElementById('file-info');
const submitBtn = document.getElementById('submit-btn');
const form = document.getElementById('upload-form');
const books = [];

let selectedFile = null;
const MAX_MB = 15;

function setInfo(msg, ok = true) {
  info.textContent = msg;
  info.style.color = ok ? '#cbd5e1' : '#fca5a5';
}

function accept(file) {
  if (!file) return 'No file selected.';
  if (file.type !== 'application/pdf') return 'Only PDF files are allowed.';
  if (file.size > MAX_MB * 1024 * 1024) return `Max size is ${MAX_MB} MB.`;
  return null;
}

function setFile(file) {
  const err = accept(file);
  if (err) {
    selectedFile = null;
    submitBtn.disabled = true;
    setInfo(err, false);
    return;
  }
  selectedFile = file;
  submitBtn.disabled = false;
  setInfo(`Selected: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`);
}

async function show_books(){
  console.log('Fetching existing book list...');
  const lib = document.getElementById('books');
  const database_name = sessionStorage.getItem('database_name');
  console.log(`Using folder name: ${database_name}`);
  const res = await fetch(`/api/book_list/${encodeURIComponent(database_name)}`);
  const data = await res.json();
  data.books.forEach(book => {
    const li = document.createElement('li');
    li.textContent = book;
    lib.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch existing books on load
  await show_books();
})

// ----- File picker -----
document.getElementById('browse-btn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => setFile(fileInput.files?.[0]));

function openPicker() {
  // reset so selecting the same file again still fires "change"
  fileInput.value = '';
  fileInput.click();
}

// ---- drag & drop ----
['dragenter','dragover'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropzone.classList.add('hover');
  });
});
['dragleave','drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
  });
});
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files?.[0];
  setFile(file);
});

// ---- click to open picker (one path only) ----
// If you want the whole dropzone clickable:
dropzone.addEventListener('click', (e) => {
  // If the browse button was clicked, let its handler run (and stop bubbling)
  if (e.target.closest('#browse-btn')) return;
  openPicker();
});

// Prevent default outside the dropzone to stop the browser from opening files
['dragover','drop'].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault())
);

// ----- Submit (upload) -----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) return;

  submitBtn.disabled = true;
  setInfo('Uploading…');

  try {
    const fd = new FormData(form);
    fd.append('file', selectedFile);

    const database_name = sessionStorage.getItem("database_name");
    const res = await fetch(`/api/upload_book/${database_name}`, {
      method: 'POST',
      body: fd
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setInfo(`Uploaded ✓ (${data.filename ?? selectedFile.name})`);
  } catch (err) {
    setInfo(`Upload failed: ${err.message}`, false);
  } finally {
    submitBtn.disabled = false;
  }
});
