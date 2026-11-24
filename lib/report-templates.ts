// Plantillas internas: datos de referencia, nunca reportes publicados automáticamente.
// Las cifras de Mente Efectiva corresponden a la línea base histórica enero-junio 2026.
export type PilotSnapshot = {
 kind:'levo'|'mente';
 label:string;
 methodology:string;
 beforeCount?:number;
 duringCount?:number;
 beforeMedianHours?:number;
 duringMedianHours?:number;
 beforeWithin24Pct?:number;
 duringWithin24Pct?:number;
 historicalLeads?:number;
 historicalContacted?:number;
 historicalInterested?:number;
 historicalSales?:number;
 historicalNoAnswerPct?:number;
};
export const levoSnapshot:PilotSnapshot={kind:'levo',label:'Comparación observacional · WhatsApp', methodology:'Antes: 75 conversaciones (21 sep–14 oct). Durante: 88 conversaciones (15 oct–20 nov). La diferencia entre períodos no es un experimento controlado ni prueba causal exclusiva.',beforeCount:75,duringCount:88,beforeMedianHours:9.5,duringMedianHours:4.65,beforeWithin24Pct:68,duringWithin24Pct:72.7};
export const menteSnapshot:PilotSnapshot={kind:'mente',label:'Diagnóstico histórico · antes de Nawi',methodology:'Enero–junio 2026, previo a Nawi. «No contesta» NO significa lead sin gestionar. Sin antes/después verificado de la intervención.',historicalLeads:585,historicalContacted:210,historicalInterested:134,historicalSales:51,historicalNoAnswerPct:64.1};
export type ReportTemplate = {
 report_type:'diario'|'mensual'; period_start:string;period_end:string;title:string;
 summary:string;achievements:string;pending_actions:string;recommendations:string;
 activity_items:{description:string;quantity:number|null;status:string}[];
 referral_items:{label:string;reason:string;status:string}[];
 metrics:{consultas:number|null;seguimientos:number|null;campanas:number|null;respuestas:number|null;derivaciones:number|null};
 evidence_note:string;
 pilot_snapshot:PilotSnapshot|null;
};
const blanks=()=>({consultas:null,seguimientos:null,campanas:null,respuestas:null,derivaciones:null});
export const levoTemplate:ReportTemplate={
 report_type:'mensual',period_start:'2026-10-15',period_end:'2026-11-20',title:'Piloto Nawi × Levo · gestión comercial asistida',
 summary:'Gestión conjunta Nawi–Levo desde mediados de octubre: atención y seguimiento comercial, segmentación de bases y campañas de comunicación. En una muestra de WhatsApp de 75 conversaciones previas y 88 durante la intervención, la mediana de primera respuesta pasó de 9.5 a 4.65 horas y la proporción atendida dentro de 24 h de 68.0% a 72.7%. Comparación descriptiva: no implica causalidad exclusiva.',
 achievements:'Auditoría de Levo: 8 campañas de Brevo registradas entre el 02 y el 19 de noviembre, con 2,327 correos enviados, 2,239 entregados, 115 aperturas registradas y 15 clics. Se documentaron asimismo 39 correos de Outlook enviados con Claude y 6 mensajes individuales de WhatsApp. En el Excel de WhatsApp, 10 conversaciones de la etapa Nawi figuran marcadas como venta, pero los pagos y montos deben conciliarse con contabilidad. No se atribuyen ingresos confirmados a estas campañas.',
 pending_actions:'Conciliar ventas y montos con matrículas y contabilidad. Confirmar ejecución efectiva de tandas masivas de Outlook y resultados de WhatsApp. Actualizar estado de los contactos que ya compraron y los indicadores de los registros de campañas.',
 recommendations:'Mantener revisión programada de consultas; excluir contactos que ya compraron; actualizar las listas autorizadas y verificar la entregabilidad antes de campañas. Separar gestiones ejecutadas, previstas y sus resultados.',
 activity_items:[{description:'Auditoría de campañas en Brevo: 8 campañas enviadas, con distinto grado de evidencia de participación de Claude',quantity:8,status:'Ejecutada'},{description:'Envíos de Outlook documentados con Claude (no incluye tandas de ejecución no verificada)',quantity:39,status:'Ejecutada'},{description:'Mensajes individuales de WhatsApp documentados',quantity:6,status:'Ejecutada'},{description:'Tandas masivas de Outlook; entrega completa sin conciliación',quantity:null,status:'Pendiente'}],
 referral_items:[],metrics:blanks(),
 pilot_snapshot:levoSnapshot,
 evidence_note:'Fuentes: Auditoría del seguimiento comercial y marketing con Claude · Levo Learning Center (22/11/2026), Excel Propuesta_origen_leads_WhatsApp_Levo. Inicio Nawi a mediados de octubre confirmado por equipo. 75 registros previos y 88 durante Nawi; datos observacionales. Las métricas principales del editor (consultas atendidas, seguimientos, etc.) quedan vacías porque no están cuantificadas uniformemente para el período. 10 filas marcadas como venta NO equivalen a 10 pagos verificados.'
};
export const menteTemplate:ReportTemplate={
 report_type:'mensual',period_start:'2026-10-15',period_end:'2026-11-22',title:'Piloto Nawi × Mente Efectiva · gestión comercial asistida',
 summary:'Piloto de gestión comercial asistida para Mente Efectiva. El equipo confirma trabajo conjunto con Nawi desde mediados de octubre de 2026. El respaldo documental disponible se concentra en diagnóstico de la captación y seguimiento, análisis del embudo, estados comerciales y propuestas de reactivación. Las cantidades de acciones ejecutadas después del inicio del piloto y sus resultados todavía no se han consolidado en la auditoría.',
 achievements:'Diagnóstico HISTÓRICO de enero a junio de 2026, anterior a Nawi: 585 leads analizados; 210 registrados como contactados; 134 con interés; 51 ventas históricas registradas. Un 64.1% estaba clasificado como «No contesta» (no necesariamente «nunca atendido»). Estas cifras son referencia de la empresa y NO resultados logrados por Nawi. La auditoría recogió propuestas de segmentación, reactivación y estados comerciales; su ejecución y resultados posteriores requieren evidencia adicional.',
 pending_actions:'Completar con registros fechados de octubre y noviembre: consultas atendidas por Nawi, seguimientos y campañas efectivamente ejecutados, respuestas, derivaciones, citas/consultas confirmadas y montos de pagos verificados. Evitar incorporar detalles clínicos de pacientes.',
 recommendations:'Priorizar continuidad de respuesta y seguimiento de prospectos con consentimiento. Distinguir «No contesta» de «No atendido». Mantener control de origen de leads, derivaciones al personal autorizado y comunicación de informes comerciales agregados sin datos sensibles.',
 activity_items:[{description:'Diagnóstico histórico del embudo y canales de captación (línea base pre-Nawi)',quantity:585,status:'Ejecutada'},{description:'Diseño de estados del proceso y propuestas de reactivación; ejecución posterior sin documentación cuantitativa consolidada',quantity:null,status:'Preparada'}],
 referral_items:[],metrics:blanks(),
 pilot_snapshot:menteSnapshot,
 evidence_note:'Fuentes: Nawi · Auditoría del piloto comercial (1) y (2), apartados Mente Efectiva, M1–M5. 585/210/134/51 y 64.1% son cifras históricas de enero–junio de 2026 y no deben presentarse como impacto de Nawi. Trabajo conjunto posterior a mediados de octubre confirmado por el equipo, sin indicadores cuantificados de ejecución. La información sensible de pacientes debe excluirse.'
};
