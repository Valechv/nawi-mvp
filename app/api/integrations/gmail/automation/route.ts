import {allowed,jsonError} from '@/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,enabled=false,label='',ai_enabled=false,confirmed=false}=await request.json();
  const {db}=await allowed(request,organization_id,true);
  if(enabled&&!confirmed)throw new Error('Confirma el permiso de lectura periódica de correos comerciales etiquetados');
  if(enabled&&(typeof label!=='string'||!/^[A-Za-z0-9_-]{2,50}$/.test(label)))throw new Error('Usa una etiqueta Gmail específica, por ejemplo NawiVentas (sin espacios)');
  const {error}=await db.from('gmail_connections').update({auto_sync_enabled:Boolean(enabled),auto_sync_query:enabled?'label:'+label:null,auto_ai_enabled:Boolean(enabled&&ai_enabled),updated_at:new Date().toISOString()}).eq('organization_id',organization_id);
  if(error)throw error;return Response.json({ok:true,enabled:Boolean(enabled)});
 }catch(e){return jsonError(e)}
}
