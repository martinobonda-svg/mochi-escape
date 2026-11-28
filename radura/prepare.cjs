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
const frames={...read(__dirname,'turns')};
for(const key of fs.readdirSync(destination)){
  if(/^(walk[0-4]|honey[0-3]|moon[0-3])[0-3]\.webp$/.test(key)){
    frames[key.slice(0,-5)]=fs.readFileSync(path.join(destination,key)).toString('base64');
  }
}
fs.writeFileSync(path.join(destination,'wardrobe-frames.js'),'const WARDROBE_FRAMES='+JSON.stringify(frames)+';');
