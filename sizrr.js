#!/usr/bin/env node
import {readdirSync as rD,readFileSync as rF,statSync as sS,existsSync as eX} from'node:fs';
import {join as j,resolve as r} from'node:path';
import {createInterface as cI} from'node:readline';
import {execSync as eS} from 'node:child_process';

const size=p=>eX(p)?sS(p).isDirectory()?rD(p).reduce((a,f)=>a+size(j(p,f)),0):sS(p).size:0;
const fmt=b=>{const u=['B','KB','MB','GB','TB'];let[s,i]=[b,0];for(;s>=1024&&i<u.length-1;s/=1024,i++);return`${s.toFixed(2)} ${u[i]}`};
const clr=s=>s<1e6?'\x1b[32m':s<1e7?'\x1b[33m':'\x1b[31m';
const bar=s=>s?'█'.repeat(Math.ceil(s/1e6*2)).slice(0,50):'';
const percent=(p,t)=>t?Math.round(p/t*1000)/10:0;

const getMeta=(p,n)=>{
  try{
    const pJ=j('node_modules',n,'package.json');
    if(eX(pJ)){
      const d=JSON.parse(rF(pJ,'utf-8'));
      return{
        l:d.license||'Unknown',
        d:d.description?.substring(0,50)||'',
        a:d.author?.name||d.author||'',
        v:d.version||p.v||'',
        s:d.scripts?.length||Object.keys(d.scripts||{}).length||0,
        b:d.bundleDependencies||d.bundledDependencies||[],
        t:Object.keys(d.dependencies||{}).length,
        o:Date.now()-sS(j('node_modules',n)).mtime
      };
    }
    return{};
  }catch{return{};}
};

const getLatest=n=>{
  try{
    const latest=eS(`npm view ${n} version`,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).toString().trim();
    return latest;
  }catch{return null;}
};

const sizr=async(t=0,o={})=>{
  try{
    console.log('\x1b[1m\x1b[36mSizrr v1.0.7 - Advanced Package Size Analyzer\x1b[0m');
    
    const p=JSON.parse(rF('package.json','utf-8'));
    console.log(`\x1b[1mProject:\x1b[0m ${p.name} v${p.version}\n`);
    
    const d={...(p.dependencies||{}),...(p.devDependencies||{})};
    const isDev=n=>Object.keys(p.devDependencies||{}).includes(n);
    
    console.log(`Found ${Object.keys(d).length} dependencies (${Object.keys(p.dependencies||{}).length} prod, ${Object.keys(p.devDependencies||{}).length} dev)`);
    console.log('Analyzing sizes...\n');
    
    const rs=await Promise.all(Object.entries(d).map(async([k,v])=>{
      try{
        const pP=j('node_modules',k);
        const s=size(pP);
        const hs=fmt(s);
        const meta=getMeta(p,k);
        const latest=getLatest(k);
        const outdated=latest&&meta.v&&latest!==meta.v;
        return{
          n:k,
          v:meta.v||v,
          s,
          hs,
          c:clr(s),
          b:bar(s),
          dev:isDev(k),
          license:meta.l,
          desc:meta.d,
          deps:meta.t||0,
          latest,
          outdated
        };
      }catch{return{n:k,v,s:0,hs:'N/A',c:'\x1b[90m',b:'',dev:isDev(k)};}
    })).then(r=>r.sort((a,b)=>(o.a?a.s-b.s:b.s-a.s)));
    
    t=rs.reduce((a,{s})=>a+s,0);
    
    if(process.argv.includes('--filter')){
      const i=process.argv.indexOf('--filter');
      const f=process.argv[i+1];
      if(f)rs.filter(p=>p.s>parseFloat(f)*1e6);
    }
    
    if(process.argv.includes('--outdated')){
      rs.filter(p=>p.outdated);
    }
    
    if(process.argv.includes('--interactive')){
      const rl=cI({input:process.stdin,output:process.stdout});
      console.log('\x1b[1mInteractive Mode:\x1b[0m Type "sort size", "sort name", "filter [MB]", "outdated", or "exit"');
      for await(const l of rl){
        if(l==='exit')break;
        if(l==='sort size')rs.sort((a,b)=>b.s-a.s);
        if(l==='sort name')rs.sort((a,b)=>a.n.localeCompare(b.n));
        if(l==='outdated')rs.filter(p=>p.outdated);
        if(l.startsWith('filter')){
          const[,f]=l.split(' ');
          rs.filter(p=>p.s>parseFloat(f)*1e6);
        }
        console.clear();
        print(rs,t,p);
      }
      rl.close();
      return;
    }
    
    print(rs,t,p);
    
    const outdated=rs.filter(p=>p.outdated).length;
    if(outdated)console.log(`\n\x1b[33mFound ${outdated} outdated packages. Run with --outdated to see only those.\x1b[0m`);
    
  }catch(e){console.error("Error:",e.message);process.exit(1);}
};

const print=(rs,t,p)=>{
  const devSize=rs.filter(p=>p.dev).reduce((a,{s})=>a+s,0);
  const prodSize=t-devSize;
  
  console.log("\x1b[1mPackage Sizes:\x1b[0m (█ = ~500KB)");
  console.log("=".repeat(90));
  console.log("\x1b[1m%-25s %-10s %-8s %-10s %-20s\x1b[0m","PACKAGE","SIZE","%","TYPE","LICENSE");
  console.log("-".repeat(90));
  
  rs.forEach(({n,hs,c,b,dev,license,outdated,v,latest})=>{
    const pct=percent(rs.find(i=>i.n===n).s,t);
    console.log(
      `${c}${n.padEnd(25)} ${hs.padStart(10)} ${pct.toString().padStart(6)}% ${
        dev?'\x1b[36mdev\x1b[0m':'prod'
      } ${license?.padEnd(10)||''} ${
        outdated?`\x1b[33m${v} → ${latest}\x1b[0m`:v
      } ${b}\x1b[0m`
    );
  });
  
  console.log("=".repeat(90));
  console.log(`\x1b[1mTotals:\x1b[0m`);
  console.log(`Production:  ${fmt(prodSize).padStart(10)} (${percent(prodSize,t)}%)`);
  console.log(`Development: ${fmt(devSize).padStart(10)} (${percent(devSize,t)}%)`);
  console.log(`All packages: ${fmt(t).padStart(9)} ${bar(t)}`);
  
  console.log(`\n\x1b[90mNode modules folder contains ${fmt(size('node_modules'))} total\x1b[0m`);
  console.log('\nRun with --interactive for more options, --outdated to see outdated packages');
};

if(import.meta.url===r(process.argv[1]))sizr();
export{sizr};
