import {allowed,jsonError} from '@/lib/server/auth';
import {decrypt} from '@/lib/server/crypto';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,lead_id,message,approved=false}=await request.json();
  if(approved!==true)throw new Error('La persona responsable debe aprobar este mensaje antes de enviarlo');
  if(typeof message!=='string'||message.trim().length<2||message.length>1000)throw new Error('Mensaje vacío o demasiado largo');
  const {db,user}=await allowed(request,organization_id);
  const [leadQuery,channelQuery]=await Promise.all([
   db.from('leads').select('id,phone,intent,status').eq('organization_id',organization_id).eq('id',lead_id).single(),
   db.from('whatsapp_channels').select('phone_number_id,access_token_ciphertext').eq('organization_id',organization_id).single()
  ]);
  const lead=leadQuery.data,channel=channelQuery.data;
  if(leadQuery.error||!lead||!lead.phone)throw new Error('Lead sin teléfono válido');
  if(channelQuery.error||!channel?.access_token_ciphertext)throw new Error('Configura token de WhatsApp Cloud API para enviar');
  if(lead.intent==='No interesado'||['Ganado','Perdido'].includes(lead.status))throw new Error('Lead cerrado, no enviar');
  const number=lead.phone.replace(/\D/g,'');if(!/^\d{8,16}$/.test(number))throw new Error('Teléfono inválido');
  const {data:lastInbound,error:lastError}=await db.from('source_events').select('event_at,created_at').eq('organization_id',organization_id).eq('lead_id',lead_id).eq('provider','whatsapp').order('created_at',{ascending:false}).limit(1);
  if(lastError)throw lastError;
  if(!lastInbound?.length||Date.now()-new Date(lastInbound[0].event_at||lastInbound[0].created_at).getTime()>23*60*60*1000)throw new Error('Sin mensaje reciente del cliente dentro de la ventana permitida. Se requiere una plantilla aprobada; este MVP no la envía.');
  const graphVersion=process.env.META_GRAPH_VERSION||'v23.0';
  if(!/^v\d+\.\d+$/.test(graphVersion))throw new Error('META_GRAPH_VERSION inválido');
  const response=await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(channel.phone_number_id)}/messages`,{method:'POST',headers:{authorization:'Bearer '+decrypt(channel.access_token_ciphertext),'content-type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:number,type:'text',text:{preview_url:false,body:message.trim()}})});
  const result=await response.json();if(!response.ok)throw new Error('Meta no envió el mensaje: '+JSON.stringify(result.error||{}).slice(0,250));
  await db.from('outbound_messages').insert({organization_id,lead_id,provider:'whatsapp',external_id:result.messages?.[0]?.id||null,content_preview:message.slice(0,180),created_by:user.id});
  return Response.json({ok:true,message_id:result.messages?.[0]?.id||null});
 }catch(e){return jsonError(e)}
}
