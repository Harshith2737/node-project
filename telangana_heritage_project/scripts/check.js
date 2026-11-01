"use strict";
const fs=require("node:fs"),path=require("node:path"),{execFileSync}=require("node:child_process");
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==="node_modules"||e.name.startsWith("."))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith(".js"))files.push(p);}}
for(const root of ["api","src","scripts","frontend"])if(fs.existsSync(root))walk(root);
for(const file of files)execFileSync(process.execPath,["--check",file],{stdio:"inherit"});
console.log("Syntax check passed:",files.length,"JavaScript files.");
