import {allowed,jsonError} from '@/lib/server/auth';
import {gmailToken,gmailGet,gmailHeader,gmailText} from '@/lib/server/gmail';
import {ingestMessage,takeEmail} from '@/lib/server/import';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,message_ids,analyze_with_claude=false,confirm_business_data=false}=await request.json();
  const {db}=await allowed(request,organization_id,true);
  if(!confirm_business_data)throw new Error('Confirma que seleccionaste únicamente mensajes comerciales autorizados');
  if(!Array.isArray(message_ids)||message_ids.length<1||message_ids.length>10||message_ids.some(x=>typeof x!=='string'||x.length>160))throw new Error('Selecciona de 1 a 10 correos de la vista previa');
  const {token}=await gmailToken(db,organization_id);
  let imported=0,skipped=0;const errors:string[]=[];
  for(const id of [...new Set(message_ids)]){
   try{
    const msg=await gmailGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`,token);
    const from=gmailHeader(msg,'From'),email=takeEmail(from);
    if(!email||((msg.labelIds||[]) as string[]).includes('SENT')){skipped++;continue;}
    const content=(gmailHeader(msg,'Subject')+'\n'+(gmailText(msg.payload)||msg.snippet||'')).slice(0,2500);
    const result=await ingestMessage(db,organization_id,'gmail',msg.id,{name:from.split('<')[0].trim().slice(0,180)||email,email},content,Boolean(analyze_with_claude));
    if(result.duplicate)skipped++;else imported++;
   }catch(e){errors.push(e instanceof Error?e.message:'Error de Gmail')}
  }
  await db.from('gmail_connections').update({last_synced_at:new Date().toISOString(),last_error:errors[0]||null}).eq('organization_id',organization_id);
  return Response.json({imported,skipped,errors});
 }catch(e){return jsonError(e)}
}
