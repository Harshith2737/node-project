// Telangana Heritage - simple Express API starter
// Install: npm install express cors
// Run: node server.js
const express=require("express"),cors=require("cors");
const app=express(); app.use(cors()); app.use(express.json());
const places=[
 {id:1,name:"Charminar",district:"Hyderabad",category:"Heritage"},
 {id:2,name:"Golconda Fort",district:"Hyderabad",category:"Heritage"},
 {id:3,name:"Ramappa Temple",district:"Mulugu",category:"Heritage"},
 {id:4,name:"Warangal Fort",district:"Warangal",category:"Heritage"},
 {id:5,name:"Kuntala Waterfalls",district:"Nirmal",category:"Nature"},
 {id:6,name:"Pochampally",district:"Yadadri Bhuvanagiri",category:"Culture"}
];
let reports=[];
app.get("/api/places",(req,res)=>res.json(places));
app.get("/api/places/:id",(req,res)=>{const p=places.find(x=>x.id==req.params.id);p?res.json(p):res.status(404).json({error:"Not found"})});
app.get("/api/reports",(req,res)=>res.json(reports));
app.post("/api/reports",(req,res)=>{const r={id:Date.now(),status:"Under Review",createdAt:new Date().toISOString(),...req.body};reports.push(r);res.status(201).json(r)});
app.get("/api/health",(req,res)=>res.json({status:"ok",project:"Telangana Heritage"}));
app.listen(5000,()=>console.log("API running on http://localhost:5000"));