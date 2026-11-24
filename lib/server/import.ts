import type {SupabaseClient} from '@supabase/supabase-js';
import {analyzeText} from './ai';
const cleanPhone=(s:string)=>s.replace(/[^\d]/g,'');
function takeEmail(header:string){return (header.match(/<([^>]+@[^>]+)>/)||header.match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i))?.[1]?.toLowerCase()||null}
export async function ingestMessage(db:SupabaseClient,org:string,provider:'gmail'|'whatsapp',externalId:string,contact:{name?:string;email?:string;phone?:string},content:string,allowAI=false,eventTime?:string){
 const {data:exists}=await db.from('source_events').select('id').eq('organization_id',org).eq('provider',provider).eq('external_id',externalId).maybeSingle();
 if(exists)return {duplicate:true};
 const phone=cleanPhone(contact.phone||'');const email=(contact.email||'').trim().toLowerCase();
 if(!phone&&!email)throw new Error('Contacto sin identificador');
 // Solo contactos externos. Cada empresa tiene sus propios registros.
 let query=db.from('leads').select('*').eq('organization_id',org);
 if(email)query=query.ilike('email',email);else query=query.eq('phone',phone);
 const {data:matches,error:qerr}=await query.limit(1);if(qerr)throw qerr;
 let lead=matches?.[0];
 if(!lead){const insert={organization_id:org,name:(contact.name||email||phone).slice(0,180),email:email||null,phone:phone||null,source:provider==='gmail'?'Gmail':'WhatsApp',status:'Por calificar',notes:content.slice(0,1200)};
 const {data:created,error}=await db.from('leads').insert(insert).select('*').single();if(error)throw error;lead=created;
 }else if(content.trim()){
 // Los datos que ya registró un humano se preservan; no se concatenan historiales completos.
 const note=[lead.notes||'',`[${provider}] ${content.slice(0,350)}`].filter(Boolean).join('\n').slice(-2000);
 await db.from('leads').update({notes:note}).eq('id',lead.id).eq('organization_id',org);
 }
 const {error:insertEvent}=await db.from('source_events').insert({organization_id:org,lead_id:lead.id,provider,external_id:externalId,summary:content.slice(0,300),event_at:eventTime||new Date().toISOString()});
 if(insertEvent){if(insertEvent.code==='23505')return {duplicate:true};throw insertEvent;}
 if(allowAI&&!['Ganado','Perdido'].includes(lead.status)&&lead.intent!=='No interesado'&&content.trim().length>10&&process.env.ANTHROPIC_API_KEY){
 try{const insight=await analyzeText(content);
 await db.from('ai_insights').upsert({organization_id:org,lead_id:lead.id,insight,model:process.env.CLAUDE_MODEL||'claude-sonnet-4-6',source:provider,updated_at:new Date().toISOString()},{onConflict:'lead_id'});
 const updates:Record<string,string>={};if(lead.intent==='Sin información'&&insight.intent!=='Sin información')updates.intent=insight.intent;if(lead.urgency==='Desconocida'&&insight.urgency!=='Desconocida')updates.urgency=insight.urgency;if(!lead.service&&insight.service)updates.service=insight.service;
 if(Object.keys(updates).length)await db.from('leads').update(updates).eq('id',lead.id).eq('organization_id',org);
 }catch{/* No romper ingestión si Claude no está disponible. */}}
 return {created:!matches?.length,lead_id:lead.id};
}
export {takeEmail};
