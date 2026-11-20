import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {RokuAdapter,privateIP} from './roku.js';
test('restringe destinos a IPv4 privados',()=>{for(const ip of ['127.0.0.1','169.254.169.254','8.8.8.8','192.168.1.2:80','localhost','::1','172.32.0.1'])assert.equal(privateIP(ip),false);for(const ip of ['192.168.1.20','10.0.0.2','172.16.0.5'])assert.equal(privateIP(ip),true);});
test('ECP real por HTTP: identificação, comandos e autorização',async()=>{
 const received=[];let forbidden=false;let isTV=true;
 const server=http.createServer((req,res)=>{received.push([req.method,req.url]);if(forbidden){res.writeHead(403);res.end();return;}res.end(req.url==='/query/device-info'?`<device-info><serial-number>TEST-01</serial-number><model-name>Roku TV</model-name><user-device-name>Sala &amp; TV</user-device-name><is-tv>${isTV}</is-tv></device-info>`:'');});
 await new Promise(resolve=>server.listen(8060,'127.0.0.1',resolve));
 try{const adapter=new RokuAdapter('127.0.0.1',{allowTest:true});const info=await adapter.info();assert.equal(info.name,'Sala & TV');assert.equal(info.isTV,true);await adapter.command('up');await adapter.command('mute');assert.deepEqual(received.slice(-2),[['POST','/keypress/Up'],['POST','/keypress/VolumeMute']]);await assert.rejects(()=>adapter.command('invalid'),/inválido/);forbidden=true;await assert.rejects(()=>adapter.info(),/Autorize/);forbidden=false;isTV=false;const player=await adapter.info();assert.equal(player.commands.includes('power'),false);await assert.rejects(()=>adapter.command('power'),/requer/);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('erros de transporte não fingem sucesso',async()=>{const adapter=new RokuAdapter('192.168.1.10',{fetcher:async()=>{throw new Error('timeout');}});await assert.rejects(()=>adapter.info(),/indisponível/);});
