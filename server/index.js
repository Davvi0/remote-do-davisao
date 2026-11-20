import http from 'node:http';
import https from 'node:https';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { RokuAdapter } from './adapters/roku.js';
import { discover } from './discovery.js';
import { SamsungAdapter } from './adapters/samsung.js';
import { allowRequest } from './access.js';
const Adapter={Roku:RokuAdapter,Samsung:SamsungAdapter};
const dev=process.argv.includes('--dev');
const vite=dev?await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'}):null;
const sessions=new Map();
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw new Error('Solicitação muito grande.');}return JSON.parse(raw||'{}');}
const handler=async(req,res)=>{
  if(req.method==='GET'&&req.url==='/setup/local-ca.cer'&&process.env.LOCAL_CA_CERT){
    try{const certificate=await readFile(process.env.LOCAL_CA_CERT);res.writeHead(200,{'Content-Type':'application/x-x509-ca-cert','Content-Disposition':'attachment; filename="remote-do-davisao-ca.cer"','Cache-Control':'no-store'});res.end(certificate);}catch{res.writeHead(404);res.end('Certificado local indisponivel.');}return;
  }
  if(!req.url.startsWith('/api/')) {
    if(vite)return vite.middlewares(req,res);
    try {
      const root=resolve('dist');let file=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
      if(!file.startsWith(root+sep))file=resolve(root,'index.html');
      let data;try{data=await readFile(file);}catch{file=resolve(root,'index.html');data=await readFile(file);}
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(file)]||'application/octet-stream');
      res.setHeader('Cache-Control','no-cache');res.end(data);
    }catch{res.writeHead(404);res.end('Execute npm run build primeiro.');}return;
  }
  if(!allowRequest(req,res,process.env.APP_ORIGIN))return send(res,403,{error:'Origem ou host não autorizado.'});
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  try {
    if(req.method==='GET'&&req.url==='/api/health')return send(res,200,{app:'remote-do-davisao',version:'1.1.0'});
    if(req.method==='GET'&&req.url==='/api/discover'){
      const devices=await Promise.allSettled((await discover()).flatMap(ip=>Object.values(Adapter).map(Type=>new Type(ip).info())));
      return send(res,200,{devices:devices.filter(x=>x.status==='fulfilled').map(x=>x.value)});
    }
    if(req.method==='POST'&&req.url==='/api/connect'){
      const {ip,brand='Samsung',previous}=await body(req);const Type=Adapter[brand];if(!Type)throw new Error('Fabricante não suportado.');
      if(previous&&sessions.has(previous)){sessions.get(previous).adapter.close?.();sessions.delete(previous);}
      const adapter=new Type(ip);const device=await adapter.info();
      try{await adapter.connect?.();}catch(error){adapter.close?.();throw error;}
      if(res.destroyed){adapter.close?.();return;}
      const id=randomUUID();sessions.set(id,{adapter,last:Date.now()});return send(res,200,{session:id,device});
    }
    const match=req.url.match(/^\/api\/sessions\/([\w-]+)(?:\/(command))?$/);
    const session=match&&sessions.get(match[1]);
    if(!session)return send(res,404,{error:'Sessão expirada. Conecte novamente.'});
    session.last=Date.now();
    if(req.method==='DELETE'){session.adapter.close?.();sessions.delete(match[1]);return send(res,200,{ok:true});}
    if(req.method==='GET'&&!match[2])return send(res,200,{device:await (session.adapter.health?.()||session.adapter.info())});
    if(req.method==='POST'&&match[2]){await session.adapter.command((await body(req)).command);return send(res,200,{ok:true});}
    send(res,405,{error:'Método inválido.'});
  }catch(error){send(res,400,{error:error.message});}
};
if(Boolean(process.env.TLS_KEY)!==Boolean(process.env.TLS_CERT))throw new Error('Configure TLS_KEY e TLS_CERT juntos.');
const secure=Boolean(process.env.TLS_KEY);
const server=secure?https.createServer({key:await readFile(process.env.TLS_KEY),cert:await readFile(process.env.TLS_CERT)},handler):http.createServer(handler);
setInterval(()=>{for(const [id,s]of sessions)if(Date.now()-s.last>3600000){s.adapter.close?.();sessions.delete(id);}},60000).unref();
const port=Number(process.env.PORT)||(secure?5443:5173),scheme=secure?'https':'http';
server.listen(port,'0.0.0.0',()=>{
  console.log(`remote do davisao: ${scheme}://localhost:${port}`);
  for(const list of Object.values(networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&!n.internal)console.log(`Celular na mesma rede: ${scheme}://${n.address}:${port}`);
});
