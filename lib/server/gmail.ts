import {decrypt} from './crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
export async function gmailToken(db:SupabaseClient,org:string){
 const {data:conn,error}=await db.from('gmail_connections').select('*').eq('organization_id',org).single();
 if(error||!conn)throw new Error('La empresa aún no conectó Gmail');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',refresh_token:decrypt(conn.refresh_token_ciphertext),grant_type:'refresh_token'})});
 if(!response.ok)throw new Error('No se pudo renovar Gmail. Desconecta y autoriza nuevamente');
 const body=await response.json();if(typeof body.access_token!=='string')throw new Error('Respuesta OAuth inválida');
 return {token:body.access_token,conn};
}
export async function gmailGet(url:string,token:string){
 const response=await fetch(url,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
 if(!response.ok)throw new Error('Gmail API: '+response.status);
 return response.json();
}
export function gmailHeader(msg:any,name:string){const v=msg.payload?.headers||[];return String(v.find((h:{name:string})=>h.name.toLowerCase()===name.toLowerCase())?.value||'')}
export function gmailText(payload:any):string{
 if(payload?.mimeType==='text/plain'&&payload.body?.data)return Buffer.from(payload.body.data,'base64url').toString('utf8');
 for(const p of payload?.parts||[]){const result=gmailText(p);if(result)return result;}return '';
}
