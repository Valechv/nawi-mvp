import {admin} from '@/lib/server/auth';
import {encrypt,readState} from '@/lib/server/crypto';
export const runtime='nodejs';
export async function GET(request:Request){const origin=process.env.NAWI_BASE_URL||new URL(request.url).origin;
 try{
 const qs=new URL(request.url).searchParams;
 if(qs.get('error'))throw new Error('Autorización de Google cancelada');
 const code=qs.get('code'),state=qs.get('state');if(!code||!state)throw new Error('Parámetros OAuth incompletos');
 const info=readState(state);const db=admin();const {data:m}=await db.from('memberships').select('role').eq('organization_id',info.org).eq('user_id',info.user).maybeSingle();if(m?.role!=='owner')throw new Error('Usuario sin permisos');
 const resp=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',redirect_uri:origin+'/api/integrations/gmail/callback',grant_type:'authorization_code'})});
 const token=await resp.json();if(!resp.ok||!token.refresh_token)throw new Error('No se obtuvo refresh token. Revoca el permiso anterior y vuelve a conectar.');
 const profile=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile',{headers:{authorization:'Bearer '+token.access_token}});if(!profile.ok)throw new Error('No se pudo comprobar la cuenta de correo');const details=await profile.json();
 const {error}=await db.from('gmail_connections').upsert({organization_id:info.org,connected_by:info.user,gmail_address:details.emailAddress,refresh_token_ciphertext:encrypt(token.refresh_token),updated_at:new Date().toISOString()},{onConflict:'organization_id'});if(error)throw error;
 return Response.redirect(origin+'/?gmail=connected');
 }catch(e){return Response.redirect(origin+'/?gmail=error&reason='+encodeURIComponent(e instanceof Error?e.message:'error'))}
}
