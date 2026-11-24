import type {SupabaseClient} from '@supabase/supabase-js';
import {gmailToken,gmailGet,gmailHeader,gmailText} from './gmail';
import {ingestMessage,takeEmail} from './import';
export async function syncLabeledMail(db:SupabaseClient,org:string,query:string,allowAI:boolean){
 // No escanear toda la bandeja. Solo etiqueta específica que ha configurado el propietario.
 if(!/^label:[A-Za-z0-9_-]{2,50}$/.test(query))throw new Error('Etiqueta automática inválida');
 const {token}=await gmailToken(db,org);
 const q=query+' newer_than:30d in:inbox -in:spam -in:trash';
 const result=await gmailGet('https://gmail.googleapis.com/gmail/v1/users/me/messages?'+new URLSearchParams({maxResults:'5',q}),token);
 let imported=0;
 for(const item of result.messages||[]){
  try{
   const msg=await gmailGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=full`,token);
   if((msg.labelIds||[]).includes('SENT'))continue;
   const from=gmailHeader(msg,'From'),email=takeEmail(from);if(!email)continue;
   const content=(gmailHeader(msg,'Subject')+'\n'+(gmailText(msg.payload)||msg.snippet||'')).slice(0,2000);
   const saved=await ingestMessage(db,org,'gmail',msg.id,{email,name:from.split('<')[0].trim().slice(0,180)||email},content,allowAI);
   if(!saved.duplicate)imported++;
  }catch{/* Continúa con el siguiente correo. Reintentar el fallido en la siguiente ejecución. */}
 }
 await db.from('gmail_connections').update({last_synced_at:new Date().toISOString(),last_error:null}).eq('organization_id',org);
 return imported;
}
