export const hostedBuild=import.meta.env.BASE_URL!=='/';
export const defaultBackend='https://192.168.0.7:5443';
const KEY='davisao-local-server';
export function getBackend(){try{return localStorage.getItem(KEY)||'';}catch{return '';}}
export function validateBackend(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use apenas a origem HTTPS do servidor, como https://192.168.0.7:5443.');
  const host=url.hostname;
  const parts=host.split('.').map(Number);
  const privateHost=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(parts[0]===10||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31);
  if(!privateHost&&host!=='localhost'&&!host.endsWith('.local'))throw new Error('Informe um endereço da sua rede local.');
  return url.origin;
}
export function saveBackend(value){localStorage.setItem(KEY,validateBackend(value));}
export function clearBackend(){localStorage.removeItem(KEY);}
export function needsBackend(){return hostedBuild&&!getBackend();}
