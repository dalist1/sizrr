#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const getDirSize = p => {
  try {
    return readdirSync(p).reduce((s, f) => {
      const fp = join(p, f);
      const st = statSync(fp);
      return s + (st.isFile() ? st.size : st.isDirectory() ? getDirSize(fp) : 0);
    }, 0);
  } catch { return 0; }
};

const formatSize = b => {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let [s, i] = [b, 0];
  while (s >= 1024 && i < u.length - 1) [s, i] = [s / 1024, i + 1];
  return `${s.toFixed(2)} ${u[i]}`;
};

const getMeta = n => {
  try {
    const p = join('node_modules', n, 'package.json');
    if (!existsSync(p)) return {};
    const d = JSON.parse(readFileSync(p, 'utf-8'));
    return {
      v: d.version || '',
      l: d.license || '',
      a: typeof d.author === 'string' ? d.author : d.author?.name || '',
      d: d.description || '',
      t: !!(d.types || d.typings),
      s: Object.keys(d.scripts || {}).length,
      p: Object.keys(d.dependencies || {}).length,
      m: new Date(statSync(join('node_modules', n)).mtime).toISOString().split('T')[0]
    };
  } catch { return {}; }
};

const countFiles = n => {
  try {
    const countInDir = d => readdirSync(d).reduce((c, i) => {
      const p = join(d, i);
      const s = statSync(p);
      return c + (s.isFile() ? 1 : s.isDirectory() ? countInDir(p) : 0);
    }, 0);
    return countInDir(join('node_modules', n));
  } catch { return 0; }
};

const pct = (p, t) => t ? Math.round((p/t) * 100) : 0;
const bar = s => '█'.repeat(Math.min(20, Math.ceil(s / (1024 * 1024))));
const color = s => s < 1024 * 1024 ? '\x1b[32m' : s < 10 * 1024 * 1024 ? '\x1b[33m' : '\x1b[31m';

export const sizr = () => {
  try {
    const pj = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...(pj.dependencies || {}), ...(pj.devDependencies || {}) };
    const devNames = Object.keys(pj.devDependencies || {});
    
    console.log("\x1b[36m=== Sizrr Package Analyzer ===\x1b[0m");
    console.log(`Project: ${pj.name || 'Unknown'} v${pj.version || ''}`);
    
    const pkgs = Object.entries(deps).map(([n, v]) => {
      try {
        const p = join('node_modules', n);
        if (!existsSync(p)) return { n, s: 0, h: 'N/A' };
        
        const s = getDirSize(p);
        const m = getMeta(n);
        const f = countFiles(n);
        
        return {
          n,
          s,
          h: formatSize(s),
          d: devNames.includes(n),
          l: m.l,
          v: m.v || v,
          a: m.a,
          p: m.p,
          m: m.m,
          f,
          t: m.t,
          desc: m.d
        };
      } catch { return { n, s: 0, h: 'N/A' }; }
    }).filter(p => p.s > 0).sort((a, b) => b.s - a.s);
    
    const total = pkgs.reduce((t, p) => t + p.s, 0);
    const devSize = pkgs.filter(p => p.d).reduce((t, p) => t + p.s, 0);
    const prodSize = total - devSize;
    
    console.log(`${pkgs.length} packages analyzed (${formatSize(total)} total)`);
    
    // Fixed header formatting without printf-style placeholders
    console.log("\n\x1b[1mPACKAGE                 SIZE       %    LICENSE   FILES   DEPS  TYPES   MODIFIED\x1b[0m");
    console.log("-".repeat(85));
    
    pkgs.forEach(p => {
      const name = p.n.padEnd(22);
      const size = p.h.padStart(10);
      const percent = pct(p.s, total).toString().padStart(3);
      const license = (p.l || '').substring(0, 8).padEnd(8);
      const files = p.f.toString().padStart(7);
      const deps = (p.p || 0).toString().padStart(5);
      const types = p.t ? ' ✓ ' : '   ';
      const modified = (p.m || '').padEnd(10);
      
      console.log(
        `${color(p.s)}${name} ${size} ${percent}%  ${license} ${files} ${deps} ${types}   ${modified}\x1b[0m`
      );
    });
    
    console.log("-".repeat(85));
    console.log(`\x1b[1mProduction:\x1b[0m ${formatSize(prodSize)} (${pct(prodSize, total)}%)`);
    console.log(`\x1b[1mDevelopment:\x1b[0m ${formatSize(devSize)} (${pct(devSize, total)}%)`);
    
    console.log("\n\x1b[1mTop packages by size:\x1b[0m");
    pkgs.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. ${p.n} (${p.h}): ${bar(p.s)}`);
      if (p.desc) console.log(`   ${p.desc.substring(0, 80)}`);
    });
    
    const typed = pkgs.filter(p => p.t).length;
    console.log(`\n\x1b[1mStats:\x1b[0m TypeScript: ${typed}/${pkgs.length} pkgs (${pct(typed, pkgs.length)}%) | Files: ${pkgs.reduce((a, p) => a + p.f, 0)}`);
    
    if (process.argv.includes('--json')) {
      const output = {
        project: { name: pj.name, version: pj.version },
        summary: { total, prodSize, devSize, count: pkgs.length },
        packages: pkgs.map(({ n, s, h, d, l, v, p, f, t, m }) => ({ 
          name: n, size: s, formattedSize: h, isDev: d, license: l, 
          version: v, deps: p, files: f, hasTypes: t, modified: m
        }))
      };
      
      console.log('\nJSON data available with --json flag');
      if (process.argv.includes('--json')) console.log(JSON.stringify(output));
    }
    
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
};

if (import.meta.url === import.meta.resolve(process.argv[1])) sizr();