const fs=require('node:fs'),path=require('node:path');
const source=process.argv[2],destination=process.argv[3];
fs.mkdirSync(destination,{recursive:true});
const read=(folder,name)=>JSON.parse(fs.readFileSync(path.join(folder,name+'.json')));
const store=(key,data)=>fs.writeFileSync(path.join(destination,key+'.webp'),Buffer.from(data,'base64'));
const actor=read(source,'actors-hd');
for(const [key,data] of Object.entries(actor))if(/^walk[0-4][0-3]$/.test(key))store(key,data);
for(const [id,key] of Object.entries({mochi:'coniglio',luma:'gufo',neve:'ermellino',bruma:'walk50'}))store(id,actor[key]);
for(const [key,data] of Object.entries(read(__dirname,'menu-art')))if(/^(honey|moon)[0-3][0-3]$/.test(key))store(key,data);
for(const [id,data] of Object.entries(read(__dirname,'plush-art')))store(id,data);
const atelier={};
for(const file of fs.readdirSync(path.join(__dirname,'tailor')).filter(f=>f.endsWith('.json'))){
  const id=path.basename(file,'.json');atelier[id]=read(path.join(__dirname,'tailor'),id);
}
fs.writeFileSync(path.join(destination,'wardrobe-frames.js'),'const TAILOR='+JSON.stringify(atelier)+';');
for(const [id,data] of Object.entries(read(__dirname,'album-art')))store(id,data);
