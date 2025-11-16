Chappy

Chappy is a fullstack Chat-app, where a user can register them self as well as send private and public messages via DM or private and public channels,
The app is built with React, Typescript, Express, Cors, Bcrypt, react-dom, Zod AWS DynamoDb and JWT-Token,


## Getting Started

Try it out Here! : 

https://chappy-1t1l.onrender.com/

## Endpoints

| Resource    | Description                |
| ----------- | -------------------------- |
| `/register`     | Create users               |
| `/users`        | Manage users               |
| `/channels`     | Manage channels            |
| `/messages`     | Manage messages            |


##  Setup and Run Locally
 ```bash
git clone https://github.com/AkeVonWolfe/chappy.git
cd chappy

```
Install Dependecies
```bash
npm install
```

Set Up Environment Variables
The Env file can be sent on request
Create a .env file in the root directory and configure the following:

```bash
PUBLIC_KEY=SECRET
SECRET_KEY=SECRET
JWT_SECRET=SECRET
PORT=3000
````

Build and Run The Server

```bash
npm run restart

````

Run the local development server
```bash
npm run dev

````

## Authors

Developed by 
 GitHub: [AkeVonWolfe](https://github.com/AkeVonWolfe)
