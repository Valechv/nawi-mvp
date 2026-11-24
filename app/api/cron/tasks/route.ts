import {admin} from '@/lib/server/auth';
import {syncLabeledMail} from '@/lib/server/gmail-background';
export const runtime='nodejs';
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'No autorizado'},{status:401});
 try{
  const db=admin();
  const {data,error}=await db.rpc('sync_all_nawi_tasks');
  if(error)throw error;
  let mailImported=0;const mailErrors:string[]=[];
  const {data:connections}=await db.from('gmail_connections').select('organization_id,auto_sync_query,auto_ai_enabled').eq('auto_sync_enabled',true).limit(3);
  for(const conn of connections||[]){
   try{mailImported+=await syncLabeledMail(db,conn.organization_id,conn.auto_sync_query,Boolean(conn.auto_ai_enabled))}
   catch(e){mailErrors.push(conn.organization_id+': '+(e instanceof Error?e.message:'error'));
    await db.from('gmail_connections').update({last_error:e instanceof Error?e.message:'error'}).eq('organization_id',conn.organization_id);}
  }
  const {data:afterMail}=await db.rpc('sync_all_nawi_tasks');
  return Response.json({ok:true,tasks_created:(data||0)+(afterMail||0),gmail_imported:mailImported,gmail_errors:mailErrors});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Error de sincronización'},{status:500})}
}
