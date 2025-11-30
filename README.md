OFFICE HOURS - AI POWERED CANVAS LTI FOR COURSE-AWARE TUTORING

Overview
--------
Office Hours is a full-stack Learning Tool Interoperability (LTI) application that integrates directly with Canvas LMS to deliver AI-assisted tutoring and classroom support. It includes:

- A FastAPI backend for Retrieval-Augmented Generation (RAG)
- An Express.js server for Canvas authentication and LTI launch
- A front-end student and instructor interface
- A file ingestion pipeline for textbooks, PDFs, and Canvas content
- Full join-code system for class enrollment
- Tools for instructors such as syllabus editing, custom instructions, honesty policy management, and file uploads

Architecture
-----------
1. FastAPI RAG Engine (Python)
Located in server.py.
Handles:
- Embedding files
- Answering questions via RAG
- Custom instructions
- Mode switching
- Query handling
- Database reset

2. Express.js LTI and Orchestration Server
Located in server.js.
Responsible for:
- Canvas LTI launch (IMS-LTI)
- Session handling and secure cookies
- Serving static HTML/CSS/JS
- Uploading PDFs and Canvas materials
- Passing requests to the FastAPI backend
- User authentication and join-code system
- Syllabus, honesty policy, and settings management

3. Data Storage
Stores:
- Embedded file vectors
- User data in JSON databases
- Conversation logs
- Course data folders
- Uploaded textbooks and Canvas files

Key Features
-----------
- AI-powered question answering using course materials
- Canvas LMS LTI integration
- Secure session handling and CSP configuration
- PDF and Canvas file ingestion with embedding
- Instructor tools for editing syllabus and policies
- Student interface for chatting with the AI
- Join code system for easy class enrollment
- Per-course content management

Technologies Used
-----------------
Backend:
- FastAPI (Python)
- Node.js with Express.js
- IMS-LTI
- Uvicorn
- Multer
- Canvas API ingestion

Frontend:
- HTML, CSS, JavaScript
- React components (in certain UI sections)
- Axios

Data / RAG:
- Custom embedding pipeline
- Vector search
- JSON-based structured storage

Installation
------------
1. Clone the repository:
git clone https://github.com/<your-username>/office-hours.git
cd office-hours

2. Create a .env file in the project root:
CANVAS_API_KEY=your_canvas_key
GEMINI_API_KEY=your_ai_key
SESSION_SECRET=your_session_secret

3. Add .env to .gitignore to keep keys secret. also add data_base/users/json and place an emtpy array ex: []

4. Install dependencies:

Node server:
cd node_server
npm install

Python server:
cd python_server
pip install -r requirements.txt

Running the Servers
-------------------
Start FastAPI backend (port 4600):
uvicorn server:app --reload --port 4600

Start Node LTI server (port 4500):
node server.js

Usage
-----
Launch from Canvas:
- The tool launches via LTI and authenticates users

Student actions:
- Ask AI questions
- View past chat logs
- Join a class using a join code

Instructor actions:
- Upload PDFs and Canvas files
- Manage syllabus and honesty policy
- View and clear student chats
- Configure system instructions for the AI
- Create and manage join codes

Project Structure (Simplified)
------------------------------
project/
- server.js (Express LTI server)
- server.py (FastAPI RAG engine)
- data_base/
- public/
- scripts/
- RAG/
- README.md

Roadmap
-------
- Add database instead of JSON files
- Add real-time WebSocket support
- Instructor analytics dashboard
- Multi-model AI support (Gemini, GPT-4, Claude)
- Cloud deployment (Render, AWS, GCP)

Contributing
------------
Pull requests are welcome.
For large changes, please open an issue first.

License
-------
MIT License

Author
------
Duane Gennaro
San Diego State University
AI Researcher & Developer
LinkedIn: https://www.linkedin.com/in/duane-gennaro-548b682a5/
