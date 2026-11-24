import {allowed,jsonError} from '@/lib/server/auth';
export const runtime='nodejs';
export async function GET(request:Request){try{
 const organization_id=new URL(request.url).searchParams.get('organization_id')||'';const {db}=await allowed(request,organization_id);
 const [gmail,whatsapp]=await Promise.all([db.from('gmail_connections').select('gmail_address,last_synced_at,auto_sync_enabled,auto_sync_query,auto_ai_enabled,last_error').eq('organization_id',organization_id).maybeSingle(),db.from('whatsapp_channels').select('phone_number_id,ai_enabled,access_token_ciphertext').eq('organization_id',organization_id).maybeSingle()]);
 if(gmail.error||whatsapp.error)throw gmail.error||whatsapp.error;
 return Response.json({gmail:gmail.data||null,whatsapp:whatsapp.data?{phone_number_id:whatsapp.data.phone_number_id,ai_enabled:whatsapp.data.ai_enabled,can_send:Boolean(whatsapp.data.access_token_ciphertext)}:null,claude_enabled:!!process.env.ANTHROPIC_API_KEY});
}catch(e){return jsonError(e)}}
