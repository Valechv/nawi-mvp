import {allowed,jsonError} from '@/lib/server/auth';
import {analyzeText} from '@/lib/server/ai';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,lead_ids,permission=false}=await request.json();
  if(!permission)throw new Error('Debes autorizar explícitamente enviar las observaciones a Anthropic');
  if(!Array.isArray(lead_ids)||lead_ids.length<1||lead_ids.length>5||lead_ids.some(x=>typeof x!=='string'))throw new Error('Selecciona entre 1 y 5 leads');
  const {db}=await allowed(request,organization_id);
  const {data,error}=await db.from('leads').select('id,notes,intent,urgency,service,status').eq('organization_id',organization_id).in('id',lead_ids);
  if(error)throw error;
  let analyzed=0;const failures:string[]=[];
  for(const lead of data||[]){
   if(['Ganado','Perdido'].includes(lead.status)||lead.intent==='No interesado'||!lead.notes||lead.notes.length<8)continue;
   try{
    const insight=await analyzeText(lead.notes);
    const {error:save}=await db.from('ai_insights').upsert({organization_id,lead_id:lead.id,insight,model:process.env.CLAUDE_MODEL||'claude-sonnet-4-6',source:'importación con autorización',updated_at:new Date().toISOString()},{onConflict:'lead_id'});
    if(save)throw save;
    const updates:Record<string,string>={};
    if(lead.intent==='Sin información'&&insight.intent!=='Sin información')updates.intent=insight.intent;
    if(lead.urgency==='Desconocida'&&insight.urgency!=='Desconocida')updates.urgency=insight.urgency;
    if(!lead.service&&insight.service)updates.service=insight.service;
    if(Object.keys(updates).length){const {error:updated}=await db.from('leads').update(updates).eq('organization_id',organization_id).eq('id',lead.id);if(updated)throw updated;}
    analyzed++;
   }catch(e){failures.push(`${lead.id}: ${e instanceof Error?e.message:'error'}`)}
  }
  return Response.json({analyzed,skipped:(data||[]).length-analyzed,errors:failures});
 }catch(e){return jsonError(e)}
}
