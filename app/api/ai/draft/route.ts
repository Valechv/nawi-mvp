import {allowed,jsonError} from '@/lib/server/auth';
import {draftMessage} from '@/lib/server/ai';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,lead_id,channel='whatsapp',permission=false}=await request.json();
  if(!permission)throw new Error('Autoriza explícitamente el procesamiento de esta nota comercial con Claude');
  if(!['whatsapp','email'].includes(channel))throw new Error('Canal inválido');
  const {db}=await allowed(request,organization_id);
  const {data:lead,error}=await db.from('leads').select('id,name,notes,service,urgency,intent,status').eq('organization_id',organization_id).eq('id',lead_id).single();
  if(error||!lead)throw new Error('Lead no encontrado');
  if(lead.intent==='No interesado'||['Ganado','Perdido'].includes(lead.status))throw new Error('Contacto cerrado: no generar seguimiento');
  const draft=await draftMessage({name:lead.name,service:lead.service,notes:lead.notes,intent:lead.intent,urgency:lead.urgency},channel);
  return Response.json({draft,channel,requires_approval:true});
 }catch(e){return jsonError(e)}
}
