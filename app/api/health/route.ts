import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({app:'Nawi',status:'ok',version:'0.1.0',databaseConfigured:!!process.env.NEXT_PUBLIC_SUPABASE_URL});}
