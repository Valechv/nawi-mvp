import {createClient} from '@supabase/supabase-js';

export function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret)throw new Error('Faltan credenciales del backend de Supabase');
 return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function allowed(request:Request,orgId:string,owner=false){
 const jwt=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!jwt||!orgId)throw new Error('Sesión o empresa no especificada');
 const db=admin();
 const {data:{user},error}=await db.auth.getUser(jwt);
 if(error||!user)throw new Error('Sesión inválida');
 const {data:membership,error:memberError}=await db.from('memberships').select('role').eq('organization_id',orgId).eq('user_id',user.id).maybeSingle();
 if(memberError||!membership||(owner&&membership.role!=='owner'))throw new Error('Sin permiso para esta empresa');
 return {user,db};
}
export function jsonError(e:unknown,status=400){return Response.json({error:e instanceof Error?e.message:'Error inesperado'},{status});}
