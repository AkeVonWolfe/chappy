import express from "express";
import type { Express, RequestHandler } from "express";
import registerRouter from "./routes/register.js";
import usersRouter from "./routes/users.js";
import cors from "cors"


const port = process.env.PORT || 3000;
const app: Express = express();

app.use(cors({
  origin: "http://localhost:1337", 
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}))

// Logger
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

app.use("/", logger);
app.use(express.json());

app.use("/register", registerRouter);
app.use("/users", usersRouter);




app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
