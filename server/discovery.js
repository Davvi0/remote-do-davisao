import dgram from 'node:dgram';
import { privateIP } from './adapters/roku.js';
export function discover(timeout=2400) {
  return new Promise((resolve)=>{
    const found=new Set(); const socket=dgram.createSocket('udp4'); let finished=false;
    const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);try{socket.close();}catch{}resolve([...found]);};
    const timer=setTimeout(finish,timeout);
    socket.on('error',finish);
    socket.on('message',(message,remote)=>{
      const text=message.toString();
      if(!privateIP(remote.address))return;
      const location=text.match(/^location:\s*(.+)$/im)?.[1]?.trim();
      try {const url=new URL(location);if(url.hostname===remote.address && url.protocol==='http:')found.add(remote.address);}catch{}
    });
    socket.bind(0,()=>{socket.setMulticastTTL(2);socket.send('M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\nMX: 2\r\nST: ssdp:all\r\n\r\n',1900,'239.255.255.250',error=>{if(error)finish();});});
  });
}
