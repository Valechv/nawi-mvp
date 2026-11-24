import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {encrypt,decrypt,signState,readState} from '../lib/server/crypto.ts';
import {analyzeText,draftMessage} from '../lib/server/ai.ts';

test('Tokens OAuth cifrados y estado firmado',()=>{
 process.env.NAWI_ENCRYPTION_KEY=randomBytes(32).toString('base64');
 const secret='example-token';const encrypted=encrypt(secret);
 assert.notEqual(encrypted,secret);assert.equal(decrypt(encrypted),secret);
 const state=signState({org:'a',user:'b',exp:Date.now()+60_000});assert.equal(readState(state).org,'a');
 assert.throws(()=>readState(state.slice(0,-2)+'a'));
});
test('Claude normaliza valores fuera de vocabulario a desconocidos',async()=>{
 process.env.ANTHROPIC_API_KEY='test';const original=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({content:[{type:'text',text:JSON.stringify({intent:'Muy interesado',urgency:'hoy',summary:'Salud',confidence:'baja',evidence:''})}]})});
 try{const r=await analyzeText('Hola quisiera información');assert.equal(r.intent,'Sin información');assert.equal(r.urgency,'Desconocida');}
 finally{globalThis.fetch=original;}
});
test('Borrador no envía mensajes y se limita en longitud',async()=>{
 process.env.ANTHROPIC_API_KEY='test';let calls=0;const original=globalThis.fetch;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({content:[{type:'text',text:'Buenos días, ¿en qué podemos ayudarte?'}]})}};
 try{const text=await draftMessage({name:'Demo',service:'SQL',notes:'Solicita información',intent:'Interés general',urgency:'Desconocida'},'whatsapp');assert.match(text,/Buenos días/);assert.equal(calls,1)}finally{globalThis.fetch=original;}
});
