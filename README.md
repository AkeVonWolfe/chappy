# Chappy

Chappy is a full-stack real-time chat application where users can:

- Register an account
- Delete their own account
- enter chat as guest with limited access
- Join or create **public** and **private channels**
- Delete their own channels  
- Send **direct (DM) messages**  
- Communicate through a clean, modern UI  

The project is built using:

**React**, **TypeScript**, **Express**, **AWS DynamoDB**, **Zod**,  
**Bcrypt**, **JWT**, **CORS**, **React DOM**, and **Vite**.

---

##  Live Demo

Try the deployed version here:

 **https://chappy-1t1l.onrender.com/**

---

## 📡 API Endpoints

| Route                               | Description                    |
|-------------------------------------|--------------------------------|
| `POST /register`                    | Register a new user            |
| `GET /users`                        | Fetch all users                |
| `DELETE /users/:id`                 | Delete a user (requires token) |
| `GET /channels`                     | Fetch all channels             |
| `POST /channels`                    | Create a channel               |
| `GET /messages/:channelId`          | Fetch messages for a channel   |
| `GET /messages/direct/:from/:to`    | Fetch direct messages          |

---

## 🛠️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/AkeVonWolfe/chappy.git
cd chappy
````

### 2. Install dependencies

```bash
npm install
````
### 3. Environment Variables AKA .env 
.env can be sent on request please contant me 94.andreas.svensson@gmail.com 

PUBLIC_KEY=yourAWSKey
SECRET_KEY=yourAWSSecret
JWT_SECRET=yourJWTSecret
PORT=3000

### 4. Start development server

```bash
npm run dev
````

### 5. Build & run the backend

```bash
npm run restart-server
````

## Authors

Developed by 
 GitHub: [AkeVonWolfe](https://github.com/AkeVonWolfe)

