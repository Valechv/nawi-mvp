import {allowed,jsonError} from '@/lib/server/auth';
import {analyzeText} from '@/lib/server/ai';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,lead_id,permission=false}=await request.json();
  if(permission!==true)throw new Error('Necesitas autorizar expresamente el análisis de la nota comercial con Claude');
  if(typeof organization_id!=='string'||typeof lead_id!=='string')return Response.json({error:'Parámetros incorrectos'},{status:400});
  const {db}=await allowed(request,organization_id);
  const {data:lead,error}=await db.from('leads').select('id,name,notes,service,status,intent,urgency').eq('organization_id',organization_id).eq('id',lead_id).single();if(error||!lead)throw new Error('Lead no encontrado');
  if(['Ganado','Perdido'].includes(lead.status))throw new Error('Lead cerrado. No se cambia automáticamente');
  const text=(lead.notes||'').slice(0,7000);if(text.length<8)throw new Error('Añade una observación comercial antes de analizar');
  const insight=await analyzeText(text);
  const {error:saveErr}=await db.from('ai_insights').upsert({organization_id,lead_id,insight,model:process.env.CLAUDE_MODEL||'claude-sonnet-4-6',source:'nota comercial',updated_at:new Date().toISOString()},{onConflict:'lead_id'});if(saveErr)throw saveErr;
  // Solo actualizar campos desconocidos; nunca reemplazar juicio humano ni cerrar ventas.
  const changes:Record<string,string>={};
  if(lead.intent==='Sin información'&&insight.intent!=='Sin información')changes.intent=insight.intent;
  if(lead.urgency==='Desconocida'&&insight.urgency!=='Desconocida')changes.urgency=insight.urgency;
  if(!lead.service&&insight.service)changes.service=insight.service;
  if(Object.keys(changes).length){const {error:updateError}=await db.from('leads').update(changes).eq('organization_id',organization_id).eq('id',lead_id);if(updateError)throw updateError;}
  return Response.json({insight,updated:changes});
 }catch(e){return jsonError(e)}
}
