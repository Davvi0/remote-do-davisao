import {getBackend,needsBackend} from './backend';
export async function api(path, data, method) {
  if(needsBackend())throw new Error('Configure seu servidor local abaixo para controlar uma TV. A demonstração funciona sem servidor.');
  let response;try{response=await fetch(getBackend()+'/api/'+path,{method:method||(data?'POST':'GET'),headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(path==='connect'?55000:12000)});}catch{throw new Error('Servidor local indisponível. Confira o endereço, o HTTPS e a permissão de rede local do navegador.');}
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('O endereço não está executando o servidor do remote do davisao.');
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha na conexão.');return result;
}
export const demoDevice={id:'demo',name:'TV da sala',model:'Roku TV · demonstração',ip:'Sem conexão real',commands:['up','down','left','right','ok','back','home','volumeUp','volumeDown','mute','channelUp','channelDown','play','settings','power','powerOn']};
export const demoConnection={command:async()=>new Promise(resolve=>setTimeout(resolve,70))};
