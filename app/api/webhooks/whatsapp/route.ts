import {createHmac,timingSafeEqual} from 'node:crypto';
import {admin} from '@/lib/server/auth';
import {ingestMessage} from '@/lib/server/import';
export const runtime='nodejs';
export async function GET(request:Request){const q=new URL(request.url).searchParams;
 if(q.get('hub.mode')==='subscribe'&&process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN&&q.get('hub.verify_token')===process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)return new Response(q.get('hub.challenge')||'',{status:200});
 return new Response('Forbidden',{status:403});
}
export async function POST(request:Request){
 const secret=process.env.META_APP_SECRET;if(!secret)return new Response('Not configured',{status:503});
 const raw=await request.text();const signed=request.headers.get('x-hub-signature-256')||'';
 const expected=Buffer.from(createHmac('sha256',secret).update(raw).digest('hex'),'hex');const actual=Buffer.from(signed.replace(/^sha256=/,'')||'','hex');
 if(!signed.startsWith('sha256=')||actual.length!==expected.length||!timingSafeEqual(actual,expected))return new Response('Invalid signature',{status:401});
 try{
  const payload=JSON.parse(raw);if(payload.object!=='whatsapp_business_account')return Response.json({ok:true});
  const db=admin();for(const entry of payload.entry||[])for(const change of entry.changes||[]){
   if(change.field!=='messages')continue;const val=change.value||{};const number=String(val.metadata?.phone_number_id||'');if(!number)continue;
   const {data:channel}=await db.from('whatsapp_channels').select('organization_id,ai_enabled').eq('phone_number_id',number).maybeSingle();if(!channel)continue;
   for(const message of val.messages||[]){
    if(message.type!=='text'||!message.id||!message.from)continue;
    const name=val.contacts?.find((c:{wa_id:string})=>c.wa_id===message.from)?.profile?.name||message.from;
    await ingestMessage(db,channel.organization_id,'whatsapp',message.id,{name,phone:message.from},String(message.text?.body||''),Boolean(channel.ai_enabled), /^\d{10}$/.test(String(message.timestamp||''))?new Date(Number(message.timestamp)*1000).toISOString():undefined);
   }
  }
  return Response.json({ok:true});
 }catch{return Response.json({error:'No se pudo procesar evento'},{status:500})}
}
