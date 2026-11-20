import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocketServer} from 'ws';
import WebSocket from 'ws';
import {SamsungAdapter} from './samsung.js';
const info=id=>async()=>new Response(JSON.stringify({device:{id,type:'Samsung SmartTV',modelName:'UN60DU7700',name:'Samsung sala',TokenAuthSupport:'true'}}));
test('Samsung: autorização, segredo só no servidor, comandos e reconexão com token',async()=>{
 const wss=new WebSocketServer({port:0,host:'127.0.0.1'});await new Promise(resolve=>wss.once('listening',resolve));const messages=[],queries=[];
 wss.on('connection',(socket,req)=>{queries.push(new URL(req.url,'http://localhost').searchParams);socket.send(JSON.stringify({event:'ms.channel.connect',data:{token:'secret-test-token'}}));socket.on('message',raw=>messages.push(JSON.parse(raw.toString())));});
 const create=()=>new SamsungAdapter('192.168.0.99',{fetcher:info('test-tv'),socketFactory:url=>new WebSocket(`ws://127.0.0.1:${wss.address().port}/?${new URL(url).searchParams}`)});
 let adapter=create();try{const identity=await adapter.info();assert.equal(JSON.stringify(identity).includes('token'),false);assert.equal(identity.brand,'Samsung');await adapter.connect();await adapter.health();await adapter.command('home');await adapter.command('play');await adapter.command('play');await new Promise(resolve=>setTimeout(resolve,30));assert.deepEqual(messages.map(m=>m.params.DataOfCmd),['KEY_HOME','KEY_PLAY','KEY_PAUSE']);assert.equal(messages[0].method,'ms.remote.control');assert.equal(messages[0].params.Cmd,'Click');await assert.rejects(()=>adapter.command('not-a-key'),/inválido/);adapter.close();adapter=create();await adapter.connect();assert.equal(queries[1].get('token'),'secret-test-token');}finally{adapter.close();for(const c of wss.clients)c.terminate();await new Promise(resolve=>wss.close(resolve));}
});
test('Samsung: negação e timeout não conectam',async()=>{
 for(const event of ['ms.channel.unauthorized',null]){const wss=new WebSocketServer({port:0,host:'127.0.0.1'});await new Promise(resolve=>wss.once('listening',resolve));wss.on('connection',s=>{if(event)s.send(JSON.stringify({event}));});const adapter=new SamsungAdapter('192.168.0.99',{fetcher:info('denied-tv'),pairingTimeout:80,socketFactory:()=>new WebSocket(`ws://127.0.0.1:${wss.address().port}`)});try{await assert.rejects(()=>adapter.connect(),event?/não autorizado/:/esgotado/);assert.equal(adapter.authorized,false);await assert.rejects(()=>adapter.command('home'),/perdida/);}finally{adapter.close();for(const c of wss.clients)c.terminate();await new Promise(resolve=>wss.close(resolve));}}
});
