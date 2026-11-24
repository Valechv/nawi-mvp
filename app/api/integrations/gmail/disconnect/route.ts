import {allowed,jsonError} from '@/lib/server/auth';
import {decrypt} from '@/lib/server/crypto';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id}=await request.json();const {db}=await allowed(request,organization_id,true);
  const {data:conn}=await db.from('gmail_connections').select('refresh_token_ciphertext').eq('organization_id',organization_id).maybeSingle();
  if(conn?.refresh_token_ciphertext){try{await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:decrypt(conn.refresh_token_ciphertext)})})}catch{/* Se elimina la credencial local aunque falle revocación remota */}}
  const {error}=await db.from('gmail_connections').delete().eq('organization_id',organization_id);if(error)throw error;
  return Response.json({ok:true,notice:'Autorización local eliminada. Revoca también el acceso desde tu cuenta Google si lo deseas.'});
 }catch(e){return jsonError(e)}
}
