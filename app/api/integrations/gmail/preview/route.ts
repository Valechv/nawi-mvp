import {allowed,jsonError} from '@/lib/server/auth';
import {gmailToken,gmailGet,gmailHeader} from '@/lib/server/gmail';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const {organization_id,query=''}=await request.json();
  const {db}=await allowed(request,organization_id,true);
  if(typeof query!=='string'||query.length>180)throw new Error('Filtro de correo inválido');
  // Bandeja reciente, seleccionada por usuario; nunca leer todo un buzón automáticamente.
  const q='in:inbox newer_than:14d -in:spam -in:trash -category:promotions -category:social '+query.trim();
  const {token}=await gmailToken(db,organization_id);
  const result=await gmailGet('https://gmail.googleapis.com/gmail/v1/users/me/messages?'+new URLSearchParams({maxResults:'15',q}),token);
  const preview=[];
  for(const item of result.messages||[]){
   const msg=await gmailGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,token);
   preview.push({id:msg.id,from:gmailHeader(msg,'From').slice(0,180),subject:gmailHeader(msg,'Subject').slice(0,180)});
  }
  return Response.json({messages:preview});
 }catch(e){return jsonError(e)}
}
