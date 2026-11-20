import WebSocket from 'ws';
import { privateIP } from './roku.js';

const keys={up:'KEY_UP',down:'KEY_DOWN',left:'KEY_LEFT',right:'KEY_RIGHT',ok:'KEY_ENTER',back:'KEY_RETURN',home:'KEY_HOME',volumeUp:'KEY_VOLUP',volumeDown:'KEY_VOLDOWN',mute:'KEY_MUTE',channelUp:'KEY_CHUP',channelDown:'KEY_CHDOWN',play:'KEY_PLAY',pause:'KEY_PAUSE',settings:'KEY_MENU',power:'KEY_POWER'};
// Secrets live only in this Node process, never in device responses or localStorage.
const tokens=new Map();
export class SamsungAdapter {
  constructor(ip,{fetcher=fetch,socketFactory=(url,options)=>new WebSocket(url,options),pairingTimeout=45000}={}) {
    if(!privateIP(ip))throw new Error('Informe um IPv4 da rede privada (ex.: 192.168.1.20).');
    this.ip=ip;this.fetcher=fetcher;this.socketFactory=socketFactory;this.pairingTimeout=pairingTimeout;this.authorized=false;this.paused=false;
  }
  async info(){
    let response;try{response=await this.fetcher(`http://${this.ip}:8001/api/v2/`,{redirect:'error',signal:AbortSignal.timeout(3500)});}catch{throw new Error('Samsung indisponível. Confira o IP, a rede e se a TV está ligada.');}
    if(!response.ok)throw new Error('Esta Samsung não disponibiliza a API Tizen v2 esperada.');
    let data;try{data=await response.json();}catch{throw new Error('Resposta incompatível com Samsung Tizen.');}
    const device=data.device;
    if(!device||!device.modelName||!String(device.type||'').toLowerCase().includes('samsung'))throw new Error('O endereço não identifica uma Samsung Tizen compatível.');
    let support={};try{support=typeof device.isSupport==='string'?JSON.parse(device.isSupport):device.isSupport||{};}catch{}
    this.secure=String(device.TokenAuthSupport??support.TokenAuthSupport)!=='false';
    this.identity={id:String(device.id||device.duid||this.ip),ip:this.ip,brand:'Samsung',name:device.name||data.name||'Samsung TV',model:device.modelName,isTV:true,commands:Object.keys(keys).filter(key=>key!=='pause')};
    return this.identity;
  }
  async connect(){
    if(this.authorized&&this.socket?.readyState===WebSocket.OPEN)return;
    if(!this.identity)await this.info();
    const query=new URLSearchParams({name:Buffer.from('Controle Remoto').toString('base64')});
    const token=tokens.get(this.identity.id);if(this.secure&&token)query.set('token',token);
    const url=`${this.secure?'wss':'ws'}://${this.ip}:${this.secure?8002:8001}/api/v2/channels/samsung.remote.control?${query}`;
    // Many TVs use a self-signed certificate. Exception scoped to this socket only.
    const socket=this.socketFactory(url,{rejectUnauthorized:false,handshakeTimeout:6000,maxPayload:1024*1024});this.socket=socket;
    await new Promise((resolve,reject)=>{
      let done=false;
      const fail=message=>{if(done)return;done=true;clearTimeout(timer);this.close();reject(new Error(message));};
      const timer=setTimeout(()=>fail('Tempo de autorização esgotado. Aceite “Controle Remoto” na tela da Samsung e tente novamente.'),this.pairingTimeout);
      socket.on('error',()=>fail('Não foi possível abrir o controle Samsung. Confira o modelo, o IP e as permissões da TV.'));
      socket.on('close',()=>{this.authorized=false;fail('A Samsung encerrou a conexão. Verifique a autorização na TV.');});
      socket.on('message',raw=>{
        let message;try{message=JSON.parse(raw.toString());}catch{return;}
        if(message.event==='ms.channel.unauthorized'||message.event==='ms.channel.timeOut'){
          tokens.delete(this.identity.id);this.authorized=false;
          fail('Acesso não autorizado. Permita “Controle Remoto” na Samsung; remova um bloqueio anterior na lista de dispositivos.');return;
        }
        if(message.event==='ms.error'){this.authorized=false;fail('A Samsung recusou o comando ou protocolo.');return;}
        if(message.event==='ms.channel.connect'&&!done){
          const value=message.data?.token;if(typeof value==='string'||typeof value==='number')tokens.set(this.identity.id,String(value));
          this.authorized=true;done=true;clearTimeout(timer);resolve();
        }
      });
    });
  }
  async health(){
    if(!this.authorized||this.socket?.readyState!==WebSocket.OPEN)throw new Error('Conexão Samsung perdida.');
    await new Promise((resolve,reject)=>{const socket=this.socket;const timer=setTimeout(()=>{socket.off('pong',onPong);this.close();reject(new Error('A Samsung não está respondendo.'));},3000);function onPong(){clearTimeout(timer);resolve();}socket.once('pong',onPong);socket.ping(error=>{if(error){clearTimeout(timer);socket.off('pong',onPong);reject(new Error('Conexão Samsung perdida.'));}});});
    return this.identity;
  }
  async command(command){
    if(!Object.hasOwn(keys,command)||command==='pause')throw new Error('Comando inválido.');
    if(!this.authorized||this.socket?.readyState!==WebSocket.OPEN)throw new Error('Conexão Samsung perdida. Reconecte e autorize a TV.');
    const key=command==='play'&&this.paused?'KEY_PAUSE':keys[command];
    await new Promise((resolve,reject)=>this.socket.send(JSON.stringify({method:'ms.remote.control',params:{Cmd:'Click',DataOfCmd:key,Option:'false',TypeOfRemote:'SendRemoteKey'}}),error=>error?reject(new Error('Falha ao enviar comando Samsung.')):resolve()));
    if(command==='play')this.paused=!this.paused;
  }
  close(){this.authorized=false;this.socket?.terminate();}
}
