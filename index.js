import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app=express();
const port=3000;

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res)=>{
    res.render(__dirname+"/view/home");
});

app.get("/login", (req, res)=>{
    res.render(__dirname+"/view/login");
});

app.get("/signup", (req, res)=>{
    res.render(__dirname+"/view/signup");
});

app.get("/blog", (req, res)=>{
    res.render(__dirname+"/view/blog");
});

app.get("/admin", (req, res)=>{
    res.render(__dirname+"/view/admin");
});

app.get("/adminLogin", (req, res)=>{
    res.render(__dirname+"/view/adminLogin");
});

app.listen(port, ()=>{
    console.log(`Server running on ${port}`);
});