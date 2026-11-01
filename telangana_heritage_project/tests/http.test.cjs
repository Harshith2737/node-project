"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {body,text,HttpError}=require("../src/shared/http");

test("body parser accepts objects and JSON strings",()=>{
 assert.deepEqual(body({body:{title:"Story"},headers:{}}),{title:"Story"});
 assert.deepEqual(body({body:'{"title":"Story"}',headers:{}}),{title:"Story"});
});

test("body parser rejects malformed, non-object and oversized payloads",()=>{
 assert.throws(()=>body({body:"{broken",headers:{}}),error=>error instanceof HttpError&&error.statusCode===400);
 assert.throws(()=>body({body:["not","an","object"],headers:{}}),error=>error instanceof HttpError&&error.statusCode===400);
 assert.throws(()=>body({body:{text:"x".repeat(33000)},headers:{}}),error=>error instanceof HttpError&&error.statusCode===413);
 assert.throws(()=>body({body:{},headers:{"content-length":"40000"}}),error=>error instanceof HttpError&&error.statusCode===413);
});

test("text validator trims values and enforces field bounds",()=>{
 assert.equal(text("  valid title  ","title",2,20),"valid title");
 assert.throws(()=>text("x","title",2,20),error=>error.statusCode===400);
 assert.throws(()=>text("x".repeat(21),"title",2,20),error=>error.statusCode===400);
});
