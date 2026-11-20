import { XMLParser } from 'fast-xml-parser';
import { isIP } from 'node:net';
export function privateIP(ip) {
  if (typeof ip !== 'string' || isIP(ip)!==4) return false;
  const [a,b]=ip.split('.').map(Number);
  return a===10 || (a===172 && b>=16 && b<=31) || (a===192 && b===168);
}
export const keys={up:'Up',down:'Down',left:'Left',right:'Right',ok:'Select',back:'Back',home:'Home',volumeUp:'VolumeUp',volumeDown:'VolumeDown',mute:'VolumeMute',channelUp:'ChannelUp',channelDown:'ChannelDown',play:'Play',settings:'Info',power:'PowerOff',powerOn:'PowerOn'};
const tvOnly=new Set(['volumeUp','volumeDown','mute','channelUp','channelDown','power','powerOn']);
export class RokuAdapter {
  constructor(ip,{fetcher=fetch,allowTest=false}={}) {
    if (!privateIP(ip) && !(allowTest && ip==='127.0.0.1')) throw new Error('Informe um IPv4 da rede privada (ex.: 192.168.1.20).');
    this.ip=ip; this.fetcher=fetcher;
  }
  async request(path,method='GET') {
    let response;
    try { response=await this.fetcher(`http://${this.ip}:8060/${path}`,{method,redirect:'error',signal:AbortSignal.timeout(3500)}); }
    catch { throw new Error('TV indisponível. Confira o IP, o Wi-Fi e se a TV está ligada.'); }
    if(response.status===403) throw new Error('Autorize “Controle por aplicativos móveis” nas configurações da Roku TV.');
    if(!response.ok) throw new Error(`A TV recusou a solicitação (${response.status}).`);
    return response.text();
  }
  async info() {
    const xml=await this.request('query/device-info');
    const data=new XMLParser().parse(xml)?.['device-info'];
    if(!data || !data['model-name'] || !data['serial-number']) throw new Error('O endereço não identifica um dispositivo Roku compatível.');
    this.isTV=String(data['is-tv'])==='true';
    return {id:String(data['serial-number']),ip:this.ip,brand:'Roku',name:data['user-device-name']||data['friendly-device-name']||data['model-name'],model:data['model-name'],isTV:this.isTV,commands:Object.keys(keys).filter(k=>this.isTV||!tvOnly.has(k))};
  }
  async command(command) {
    if(!Object.hasOwn(keys,command)) throw new Error('Comando inválido.');
    if(tvOnly.has(command) && !this.isTV) throw new Error('Este comando requer uma Roku TV.');
    await this.request(`keypress/${keys[command]}`,'POST');
  }
}
