import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"
import "dotenv/config"

const app = express();

app.use(cors({
    origin: 'https://counsellor-frontend.vercel.app',
    methods: ["POST","GET","PUT","PATCH"],
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'

app.get("/",(req, res) => {
    res.send("Server running successfully")
});
//declaration
app.use("/api/v1/users", userRouter);

export { app }
