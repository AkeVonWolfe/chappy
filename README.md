Chappy

Chappy is a fullstack Chat-app, where a user can register them self as well as send private and public messages via DM or private and public channels,
The app is built with React, Typescript, Express, Cors, Bcrypt, react-dom, Zod AWS DynamoDb and JWT-Token,

Base URL for local Development

http://localhost:5173

Base URL for local Server

http://localhost:1337

## Endpoints

| Resource    | Description                |
| ----------- | -------------------------- |
| `/register`     | Create users               |
| `/users`        | Manage users               |
| `/channels`     | Manage channels            |
| `/messages`     | Manage messages            |


##  Setup and Run Locally
 ```bash
git clone https://github.com/yourusername/electronic-store-api.git
cd electronic-store-api
```
Install Dependecies
```bash
npm install
```

Set Up Environment Variables
Create a .env file in the root directory and configure the following:

```bash
PORT=2474
PUBLIC_KEY=your-access-key-id
SECRET_KEY=your-secret-access-key
````
The Api key will be sent out when requested.

Build and Run The Server

```bash
npm run restart

````

Run the local development server
```bash
npm run restart

````


## Getting Started

You can use tools like Insomnia, Postman, or any HTTP client library (e.g. axios, fetch) to interact with the API
Or you can use the React UI to.


## Authors

Developed by 
 GitHub: [AkeVonWolfe](https://github.com/AkeVonWolfe)
