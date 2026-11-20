import {Power,ArrowLeftRight,ChevronUp,ChevronDown,ChevronLeft,ChevronRight,Undo2,House,Volume2,VolumeX,Plus,Minus,Play,Pause,Settings2,Wifi,RotateCw,Radio,Tv} from 'lucide-react';
import Key from '../components/Key';
import '../remote.css';
export default function Remote({remote:r}){
 const demo=r.device.id==='demo';
 const key=(name,label,Icon,style='',children)=><Key icon={Icon} label={label} className={`r-key ${style}`} disabled={r.status!=='connected'||!r.device.commands.includes(name)} onClick={()=>r.command(name,label)}>{children}</Key>;
 return <section className="remote-v2" aria-label="Controle remoto">
 <header className="r-header"><span className="r-wordmark"><Radio size={20}/>remote do davisao <small>2.0</small></span><Key icon={ArrowLeftRight} label="Trocar dispositivo" className="r-switch" onClick={r.disconnect}/></header>
 <div className="r-device"><span className="r-tv"><Tv size={25}/></span><div><h1>{r.device.name}</h1><p>{r.device.model}</p></div>{key('power','Desligar TV',Power,'r-power')}</div>
 <div className={`r-connection ${r.status==='connected'?'online':''}`}><i/>{demo?'Demonstração · nenhuma TV conectada':r.status==='connected'?'Conectado à sua TV':'Conexão interrompida'}<Wifi size={13}/></div>
 <div className="r-topkeys">{key('back','Voltar',Undo2,'r-labeled',<span>Voltar</span>)}{key('home','Início',House,'r-labeled r-home',<span>Início</span>)}{key('settings','Opções da TV',Settings2,'r-labeled',<span>Opções</span>)}</div>
 <div className="r-dial" aria-label="Navegação direcional"><div className="r-track"/>{key('up','Cima',ChevronUp,'r-up')}{key('left','Esquerda',ChevronLeft,'r-left')}{key('ok','OK',null,'r-ok',<><span>OK</span><small>SELECIONAR</small></>)}{key('right','Direita',ChevronRight,'r-right')}{key('down','Baixo',ChevronDown,'r-down')}</div>
 <div className="r-adjustments"><div><span className="r-label"><Volume2 size={14}/>Volume</span><div className="r-adjust">{key('volumeDown','Diminuir volume',Minus)}<span className="r-grip"/>{key('volumeUp','Aumentar volume',Plus)}</div></div><div><span className="r-label">Canal</span><div className="r-adjust">{key('channelDown','Canal anterior',ChevronDown)}<span className="r-grip"/>{key('channelUp','Próximo canal',ChevronUp)}</div></div></div>
 <div className="r-playback">{key('mute','Mudo',VolumeX,'r-labeled',<span>Mudo</span>)}{key('play','Reproduzir ou pausar',null,'r-play',<><Play size={20} fill="currentColor"/><Pause size={16} fill="currentColor"/></>)}<div className="r-feedback" role="status"><i/>{r.last}</div></div>
 {r.status==='offline'&&<div className="r-reconnect"><p role="alert">{r.error||'A TV não está respondendo.'}</p><button disabled={r.busy} onClick={()=>r.connect(r.device.ip)}><RotateCw size={15}/>Reconectar</button></div>}
 <footer className="r-footer"><span>{demo?'MODO DEMONSTRAÇÃO':r.device.brand+' · REDE LOCAL'}</span><span>{demo?'Experimente os botões':r.device.ip}</span>{!demo&&r.device.commands.includes('powerOn')&&<button onClick={()=>r.command('powerOn','Ligar TV')}>Ligar TV</button>}</footer>
 </section>
}
