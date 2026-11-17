export type Lead = {
 id:string; organization_id:string; name:string; phone:string|null; email:string|null; source:string; service:string|null;
 status:string; intent:string; urgency:string; last_contacted_at:string|null; next_follow_up_at:string|null;
 created_at:string; updated_at:string; notes:string|null; value_estimate:number|null; assigned_to:string|null;
};
export const statuses = ['Nuevo','Por calificar','Contactado','Seguimiento','Cotización','Ganado','Perdido'] as const;
export function priority(lead:Lead, now=new Date()) {
 if(['Ganado','Perdido'].includes(lead.status)||lead.intent==='No interesado') return {score:0,label:'Cerrado',reason:'Oportunidad cerrada o sin interés declarado',action:'Sin acción pendiente'};
 const ageH = Math.max(0,(now.getTime()-new Date(lead.created_at).getTime())/3600000);
 const due = !!lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now.getTime();
 let score=10; const reasons:string[]=[];
 if(lead.intent==='Compra explícita'){score+=45;reasons.push('Solicitó contratar o pagar');}
 if(lead.intent==='Precio o cotización'){score+=23;reasons.push('Preguntó por precio');}
 if(lead.urgency==='Inmediata'){score+=22;reasons.push('Necesidad inmediata');}
 if(lead.urgency==='Este mes'){score+=10;}
 if(due){score+=32;reasons.push('Seguimiento vencido');}
 if(['Nuevo','Por calificar'].includes(lead.status)&&!lead.last_contacted_at){score+=22;reasons.push('Sin primer contacto');if(ageH>2)score+=12;}
 if(lead.status==='Cotización'){score+=12;reasons.push('Cotización abierta');}
 score=Math.min(100,score);
 const action=due?'Retomar seguimiento vencido':lead.intent==='Compra explícita'?'Ayudar con el cierre':lead.status==='Cotización'?'Confirmar recepción de cotización':!lead.last_contacted_at?'Contactar y calificar':lead.status==='Por calificar'?'Solicitar información faltante':'Programar siguiente paso';
 return {score,label:score>=70?'Alta':score>=40?'Media':'Normal',reason:reasons.join(' · ')||'Revisar según agenda',action};
}
export function commercial(lead:Lead){
 if(lead.intent==='Sin información'||lead.urgency==='Desconocida'||lead.intent==='No interesado') return {label:'Por calificar',score:null};
 const intent:Record<string,number>={'Compra explícita':100,'Precio o cotización':75,'Interés general':45,'No interesado':0};
 const urgency:Record<string,number>={'Inmediata':100,'Este mes':70,'Más adelante':30};
 return {label:'Indicador experimental',score:Math.round((intent[lead.intent]??0)*.55+(urgency[lead.urgency]??0)*.45)};
}
