const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => new vm.Script(s));
assert(html.includes('data:image/png;base64,iVBOR'));
assert(!html.includes('__BOT_DATA__'));
const ctx = vm.createContext({assert});
vm.runInContext(scripts[0] + `
 for (const key of ['x','y','xy','hidden','move']) {
  let prev=null;
  for(let i=0;i<2000;i++) {
   const q=makeQuestion(key,prev);
   assert(Math.abs(q.target.x)<=200 && Math.abs(q.target.y)<=100);
   assert(answerMatches(q,q.target));
   if(prev) assert(key==='x'?q.target.x!==prev.target.x:key==='y'?q.target.y!==prev.target.y:q.target.x!==prev.target.x||q.target.y!==prev.target.y);
   if(q.points.length) {
    assert.equal(q.points.length,5);
    assert.equal(new Set(q.points.map(p=>p.x)).size,5);
    assert.equal(new Set(q.points.map(p=>p.y)).size,5);
    assert.equal(q.points.filter(p=>answerMatches(q,p)).length,1);
   }
   if(key==='move') {
    assert.equal(q.start.x+q.delta.x,q.target.x);
    assert.equal(q.start.y+q.delta.y,q.target.y);
    assert(q.delta.x!==0 && q.delta.y!==0);
   }
   if(!q.points.length) {
    assert(answerMatches(q,{x:q.target.x+8,y:q.target.y-8}));
    assert(!answerMatches(q,{x:q.target.x+9,y:q.target.y}));
   }
   prev=q;
  }
 }
 const a=new CoordinateActivity();
 for(let l=0;l<5;l++) {
  a.select(l);
  for(let n=0;n<5;n++) {
   const q=a.question;
   assert.equal(a.next(),false);
   assert.equal(a.submit({x:999,y:999}),false);
   assert.equal(a.record.done,n);
   assert.equal(a.question,q);
   assert.equal(a.submit(q.target),true);
   assert.equal(a.record.done,n+1);
   assert.equal(a.submit(q.target),null);
   if(n<4) assert.equal(a.next(),true);
  }
  assert.equal(a.next(),false);
 }
 assert.equal(a.total,25);
 a.select(0);assert.equal(a.record.done,5);
 a.restartLesson();assert.equal(a.total,20);assert.equal(a.record.done,0);
 const b=new CoordinateActivity();b.submit(b.question.target);const saved=b.question;b.select(4);b.select(0);
 assert.equal(b.record.done,1);assert.equal(b.question,saved);assert.equal(b.record.solved,true);
`, ctx);
console.log('PASS: inline JavaScript syntax, embedded image, 10,000 generated questions, answer tolerance, all 25 questions, retries, duplicate-click protection, navigation and reset.');
