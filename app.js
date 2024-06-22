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

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './src/routes/user.routes.js'

app.get("/",(req, res) => {
    res.send("Server running successfully")
});

app.get('/api/v1/test', (req, res) => {
    res.json({ statusCode: 200, message: 'CORS test successful' });
});
//declaration
app.use("/api/v1/users", userRouter);

export { app }
