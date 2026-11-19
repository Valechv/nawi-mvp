import {allowed,jsonError} from '@/lib/server/auth';
import {signState} from '@/lib/server/crypto';
export const runtime='nodejs';
export async function POST(request:Request){try{
 const {organization_id}=await request.json();const {user}=await allowed(request,organization_id,true);
 if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.NAWI_ENCRYPTION_KEY)throw new Error('Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y NAWI_ENCRYPTION_KEY');
 const origin=process.env.NAWI_BASE_URL;if(!origin)throw new Error('Falta NAWI_BASE_URL');
 const params=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:origin+'/api/integrations/gmail/callback',response_type:'code',scope:'https://www.googleapis.com/auth/gmail.readonly',access_type:'offline',prompt:'consent',state:signState({org:organization_id,user:user.id,exp:Date.now()+10*60*1000})});
 return Response.json({url:'https://accounts.google.com/o/oauth2/v2/auth?'+params.toString()});
}catch(e){return jsonError(e)}}
