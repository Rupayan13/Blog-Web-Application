import dotenv from "dotenv";
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import multer from "multer";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app=express();
const port=3000;

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: "public/images/",
    filename: (req, file, cb)=>{
      cb(null, file.originalname);
    }
});
  
const upload = multer({
    storage: storage
});

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB");

const authSchema = new mongoose.Schema({
    username: String,
    password: String
});

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    image: String,
    user: [authSchema],
    visibility: {type: Number, default : 0}
});

authSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", authSchema);

const Blog = new mongoose.model("Blog", blogSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", async (req, res)=>{
    try {
        const blogsAll = await Blog.find({visibility: 0});
        res.render(__dirname+"/view/home", { blogList: blogsAll, user: req.user});
    } catch (err) {
        console.log(err);
    }
});

app.get("/login", (req, res)=>{
    res.render(__dirname+"/view/login");
});

app.get("/signup", (req, res)=>{
    res.render(__dirname+"/view/signup");
});

app.post("/signup", async (req, res)=>{

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/login");
            });
        }
    });
});

app.post("/login", async (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});

app.get("/logout", async (req ,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.render(__dirname + "/view/home");
    }
}

function checkNotAuthenticated(req, res, next){
    if(!req.isAuthenticated()){
      res.redirect("/login");
    }else{
      return next();
    }
}

app.get("/blog/:id", checkNotAuthenticated, async(req, res)=>{
    const blogID = req.params.id;
        try {
          const blogFind = await Blog.findOne({_id: blogID});
          res.render(__dirname + "/view/blog", 
          {
            title: blogFind.title,
            content: blogFind.content,
            image: blogFind.image,
            user: blogFind.user[0].username
          });
        } catch (err) {
          console.log(err);
        }
});

app.get("/about", checkNotAuthenticated, (req, res)=>{
    res.render(__dirname+"/view/about", {user: req.user});
});

app.get("/add-blog", checkNotAuthenticated, (req, res)=>{
    res.render(__dirname+"/view/add-blog", {user: req.user});
});

app.post("/submit", upload.single("image"), checkNotAuthenticated, async(req, res)=>{
    const title = req.body.title;
    const content = req.body.content;
    const image = req.file.filename;
    const newBlog=new Blog({
        title: title,
        content: content,
        image: image,
        user: req.user
    });
    newBlog.save();
    res.redirect("/");
});

app.get("/admin", checkAuthenticatedAdmin, (req, res)=>{
    res.render(__dirname+"/view/admin", {username: req.session.username});
});

app.get("/adminLogin", (req, res)=>{
    res.render(__dirname+"/view/adminLogin");
});

app.post("/adminLogin", (req, res)=>{
    const username=req.body.username;
    const password=req.body.password;
    if(username==process.env.ADMIN_USERNAME && password==process.env.ADMIN_PASSWORD){
        req.session.username=username;
        res.redirect("/admin");
    }else{
        res.render(__dirname+"/view/adminLogin");
    }
});

app.get("/logoutAdmin", (req, res)=>{
    req.session.destroy(function(err){
        if(err){
            res.send("Error");
        }else{
            res.redirect("/");
        }
    });
})

function checkAuthenticatedAdmin(req, res, next){
    if(req.session.username){
        next();
    }else{
        res.redirect("/adminLogin");
    }
}

function checkNotAuthenticatedAdmin(req, res, next){
    if(req.session.username==null){
        res.redirect("/adminLogin");
    }else{
        next();
    }
}

app.listen(port, ()=>{
    console.log(`Server running on ${port}`);
});