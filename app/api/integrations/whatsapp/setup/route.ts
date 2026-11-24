import {allowed,jsonError} from '@/lib/server/auth';
import {encrypt} from '@/lib/server/crypto';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,phone_number_id,access_token,ai_enabled=false}=await request.json();
  const {db}=await allowed(request,organization_id,true);
  if(typeof phone_number_id!=='string'||!/^[0-9]{7,30}$/.test(phone_number_id))throw new Error('Ingresa el Phone Number ID oficial de Meta');
  if(!process.env.META_APP_SECRET||!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)throw new Error('Falta configurar webhook de Meta en Vercel');
  if(typeof access_token!=='string'||access_token.length<25||access_token.length>2500)throw new Error('Debes ingresar un token oficial de Meta para verificar que gestionas este número');
  const version=process.env.META_GRAPH_VERSION||'v23.0';
  if(!/^v\d+\.\d+$/.test(version))throw new Error('Versión Graph inválida');
  const verify=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phone_number_id)}?fields=id,display_phone_number`,{headers:{authorization:'Bearer '+access_token},cache:'no-store'});
  const meta=await verify.json();
  if(!verify.ok||String(meta.id)!==phone_number_id)throw new Error('Meta no pudo verificar este Phone Number ID con el token suministrado');
  const record:Record<string,unknown>={organization_id,phone_number_id,ai_enabled:Boolean(ai_enabled),access_token_ciphertext:encrypt(access_token),last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  const {error}=await db.from('whatsapp_channels').upsert(record,{onConflict:'organization_id'});if(error)throw error;
  return Response.json({ok:true,webhook:new URL('/api/webhooks/whatsapp',process.env.NAWI_BASE_URL||request.url).toString(),can_send:true});
 }catch(e){return jsonError(e)}
}
