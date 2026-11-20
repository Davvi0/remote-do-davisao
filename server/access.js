import {privateIP} from './adapters/roku.js';
export function allowRequest(req,res,configuredOrigin=''){
 let host;try{host=new URL(`http://${req.headers.host}`).hostname;}catch{return false;}
 let allowedOrigin='';try{if(configuredOrigin)allowedOrigin=new URL(configuredOrigin).origin;}catch{return false;}
 const configuredHost=allowedOrigin?new URL(allowedOrigin).hostname:'';
 if(host!=='localhost'&&host!=='127.0.0.1'&&!privateIP(host)&&!host.endsWith('.local')&&host!==configuredHost)return false;
 const ownOrigin=`${req.socket?.encrypted?'https':'http'}://${req.headers.host}`;
 const origin=req.headers.origin;
 if(origin&&origin!==ownOrigin&&origin!==allowedOrigin)return false;
 const approvedRemote=Boolean(origin&&allowedOrigin&&origin===allowedOrigin);
 if(req.headers['sec-fetch-site']==='cross-site'&&!approvedRemote)return false;
 if(approvedRemote){
  res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network','true');
 }
 return true;
}
