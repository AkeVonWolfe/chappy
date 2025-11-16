import express from "express";
import type { Express, RequestHandler } from "express";
import registerRouter from "./routes/register.js";
import usersRouter from "./routes/users.js";
import channelsRouter from "./routes/channels.js";
import messagesRouter from "./routes/messages.js";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;
const app: Express = express();

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean) as string[],
    credentials: true,
  })
);

// Logger
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

app.use("/", logger);
app.use(express.json());

// API routes
app.use("/register", registerRouter);
app.use("/users", usersRouter);
app.use("/channels", channelsRouter);
app.use("/messages", messagesRouter);

// ---------------------------------------------------------------------------
// Serve Frontend (React/Vite)
// ---------------------------------------------------------------------------

// dist folder is OUTSIDE distServer folder
// distServer/server.js
// ../dist/index.html
const frontendPath = path.join(__dirname, "..", "dist");


app.use(express.static(frontendPath));


app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
