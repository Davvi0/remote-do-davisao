import test from 'node:test';
import assert from 'node:assert/strict';
import {allowRequest} from './access.js';
test('bridge accepts configured Pages origin only, including private network preflight',()=>{
 const headers={};const res={setHeader:(key,value)=>headers[key]=value};
 const req={headers:{host:'192.168.0.7:5443',origin:'https://davvi0.github.io','sec-fetch-site':'cross-site'},socket:{encrypted:true}};
 assert.equal(allowRequest(req,res,'https://davvi0.github.io'),true);
 assert.equal(headers['Access-Control-Allow-Origin'],'https://davvi0.github.io');assert.equal(headers['Access-Control-Allow-Private-Network'],'true');
 assert.equal(allowRequest({...req,headers:{...req.headers,origin:'https://evil.example'}},res,'https://davvi0.github.io'),false);
 assert.equal(allowRequest(req,res,''),false);
 assert.equal(allowRequest({...req,headers:{host:'evil.example',origin:'http://evil.example'}},res,''),false);
});
test('local same-origin requests continue working',()=>{
 assert.equal(allowRequest({headers:{host:'192.168.0.7:5173',origin:'http://192.168.0.7:5173'},socket:{}},{setHeader(){}},''),true);
});
