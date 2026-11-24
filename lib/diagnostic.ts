import {priority,type Lead} from './scoring.ts';

export type RecoveryGroup='atender'|'recuperar'|'programados'|'calificar'|'sin_accion';
export type Evidence={kind:'dato'|'nota';message:string};
export type RecoveryInsight={group:RecoveryGroup;title:string;reason:string;nextAction:string;evidence:Evidence[];score:number};

/** No se infiere intención a partir de texto libre; solo se muestran hechos observables. */
export function explainLead(lead:Lead,now=new Date()):RecoveryInsight {
 const closed=['Ganado','Perdido'].includes(lead.status)||lead.intent==='No interesado';
 const due=!!lead.next_follow_up_at && Number.isFinite(Date.parse(lead.next_follow_up_at)) && Date.parse(lead.next_follow_up_at)<=now.getTime();
 const commercialQuote=lead.status==='Cotización';
 const newLead=!lead.last_contacted_at && ['Nuevo','Por calificar'].includes(lead.status);
 const intentBuy=lead.intent==='Compra explícita';
 const signals:Evidence[]=[];
 if(lead.intent==='Compra explícita')signals.push({kind:'dato',message:'Intención registrada: compra explícita'});
 else if(lead.intent==='Precio o cotización')signals.push({kind:'dato',message:'Intención registrada: consulta de precio o cotización'});
 if(lead.urgency!=='Desconocida')signals.push({kind:'dato',message:`Plazo declarado: ${lead.urgency.toLowerCase()}`});
 if(commercialQuote)signals.push({kind:'dato',message:'Estado registrado: cotización'});
 if(due)signals.push({kind:'dato',message:'La fecha registrada para seguimiento ya venció'});
 if(newLead)signals.push({kind:'dato',message:'No se ha confirmado el primer contacto'});
 if(lead.notes?.trim())signals.push({kind:'nota',message:'Hay observaciones comerciales para revisar; no se consideran verificadas automáticamente'});
 if(closed)return {group:'sin_accion',title:'Sin acción',reason:'Registro cerrado o persona sin interés declarado',nextAction:'No contactar salvo nueva solicitud autorizada',evidence:signals,score:0};
 const p=priority(lead,now);
 if(intentBuy||commercialQuote)return {group:'atender',title:'Atender ahora',reason:intentBuy?'Solicitud explícita de compra registrada':'Cotización abierta registrada',nextAction:intentBuy?'Verificar condiciones y atender solicitud de compra':'Verificar si se envió la cotización y acordar próximo paso',evidence:signals,score:p.score};
 if(due)return {group:'recuperar',title:'Recuperar',reason:'Seguimiento registrado con fecha vencida',nextAction:'Revisar el historial y decidir si corresponde retomar contacto',evidence:signals,score:p.score};
 if(newLead)return {group:'calificar',title:'Por calificar',reason:'Todavía no hay primer contacto confirmado',nextAction:'Hacer el primer contacto y obtener información necesaria',evidence:signals,score:p.score};
 if(lead.next_follow_up_at)return {group:'programados',title:'Programados',reason:'Existe un seguimiento futuro registrado',nextAction:'Atender en la fecha acordada',evidence:signals,score:p.score};
 return {group:'programados',title:'Programados',reason:'Oportunidad abierta sin fecha registrada',nextAction:'Verificar el estado comercial y acordar próximo paso',evidence:signals,score:p.score};
}

export function buildDiagnostic(leads:Lead[],now=new Date()){
 const active=leads.filter(l=>!['Ganado','Perdido'].includes(l.status)&&l.intent!=='No interesado');
 const items=active.map(l=>({lead:l,insight:explainLead(l,now)}));
 const count=(g:RecoveryGroup)=>items.filter(i=>i.insight.group===g).length;
 const noContact=active.filter(l=>!l.last_contacted_at).length;
 const overdue=active.filter(l=>l.next_follow_up_at&&Date.parse(l.next_follow_up_at)<=now.getTime()).length;
 const openQuote=active.filter(l=>l.status==='Cotización').length;
 const total=leads.length;
 const contactCount=leads.filter(l=>!!l.last_contacted_at).length;
 const wins=leads.filter(l=>l.status==='Ganado').length;
 const withNotes=leads.filter(l=>!!l.notes?.trim()).length;
 return {total,active:active.length,noContact,overdue,openQuote,withNotes,contactCount,wins,contactRate:total?Math.round(contactCount/total*100):0,observedWinRate:total?Math.round(wins/total*100):0,
  groups:{atender:count('atender'),recuperar:count('recuperar'),programados:count('programados'),calificar:count('calificar')},
  items:items.sort((a,b)=>b.insight.score-a.insight.score)};
}
