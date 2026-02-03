# Event Management System (SPA)

It's an application called CRUDTASK, dedicated to managing academic tasks. It was developed using Figma, APIs, and other technologies.

complying with user modules, administrator modules, functionalities, security rules and logic, and responsive UI design

## Features
✓ Simulated authentication system
✓ Role management (user/admin)
✓ Mock API consumption with JSON Server
✓ Task management
✓ Administrative panel with metrics
✓ Session persistence
✓ Clear separation between views based on role

## Tech
• HTML5
• CSS3
• Bootstrap 5
• JavaScript (Vanilla)
• JSON Server (False API)
• LocalStorage o SessionStorage

## Setup
Install:
```bash
npm install
Run API:

bash
Copiar código
npm run api
API: http://localhost:3002

Run app:

bash
Copiar código
npm run dev
App: http://localhost:5173

Demo accounts
System Admin
email  "admin@crudtask.com"
password : "Admin123!"
role : "admin"

Demo User
email : "user@crudtask.com"
password : "User123!"
role : "user"

santiago
email : "santiago@crudtask.com"
password : "User123!"
role : "user"

event-management.system/CRUDTASK page
│
├──node_modules/
├──public//
├──src/
│   ├──assets/
│   ├──constants/
│   ├──helpers/
│   ├──services/
│   ├──styles/
│   └── main.js
│
├──.gitignore
├──db.json
├──index-html
├──package-lock.json
└──README.md