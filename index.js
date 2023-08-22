import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"backend",
}).then(()=>{console.log("database connected")}).catch((e)=>{console.log(e)});

const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});
const User=mongoose.model("User",userSchema)
const app=express();

// express.static(path.join(path.resolve(),"public")); -->this is a static folder and this line makes a static folder as middle ware so we have to use it
app.use(express.static(path.join(path.resolve(),"public")));

//middle ware to aceess contact form value
app.use(express.urlencoded({extended:true}));


app.use(cookieParser());
// setting up view engine for ejs extension
 app.set("view engine","ejs"); //either we can give extension on render or we can simply set view engine and givename onlt without extension


 const isAuthenticated=async(req,res,next)=>{ // custom middle ware handler which uses next() to navigate through next hnadler 
    const{token}=req.cookies;
    if(token){
      const decoded=  jwt.verify(token,"sdbckhfvvdbfvkdvbjvbf")
      req.user= await User.findById(decoded._id);
      
        next();
    }else{
        res.redirect("/login");
    }
    
}
// res.sendFile(path.join(path.resolve(),"index.html")); this is use to send file
// render method is used to send the dynamic file/data for which we have to use html template in our case we use EJS <%= %>  other is PUG
// static file like photo video css file and frontend ki js file we can serve static file using below method
app.get("/",isAuthenticated,(req,res)=>{
res.render("logout",{name:req.user.name});

})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
   
    })
    app.post("/login",async(req,res)=>{
        const{email,password}=req.body;

    let user=await User.findOne({email});
    if(!user)return res.redirect("/register")

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch)return res.render("login",{email,mssg:"Incorrect Password"});
    const token = jwt.sign({_id:user._id},"sdbckhfvvdbfvkdvbjvbf");//encoding user id

    res.cookie("token",token,{
        httpOnly:true,expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");

    })
app.post("/register",async(req,res)=>{
const {name,email,password}=req.body;
let user=await User.findOne({email});
if(user){
  return  res.redirect("/login");
}
const hashedPassword=await bcrypt.hash(password,10);
user=await User.create({
    name,
    email,
    password:hashedPassword,
});
const token = jwt.sign({_id:user._id},"sdbckhfvvdbfvkdvbjvbf");//encoding user id

    res.cookie("token",token,{
        httpOnly:true,expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");
});
app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,expires:new Date(Date.now()),
    });
    res.redirect("/");
});







app.listen(4000,()=>{
    console.log('server is listening');
})