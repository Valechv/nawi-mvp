# Nawi v1.8 — Portal de informes comerciales

**MVP de servicio gestionado, no CRM.** Reutiliza el proyecto Next.js/Supabase de v1.7 y su inicio de sesión. No requiere API de Claude, Meta/WhatsApp ni Gmail para funcionar.

## Alcance

- **Nawi Admin (equipo):** selección de empresa, creación de informes diarios y mensuales, registro de gestiones, métricas verificadas, derivaciones y pendientes, borradores, aprobación/publicación y registro manual de entrega.
- **Empresa:** acceso de lectura a sus informes publicados únicamente, historial, indicadores, actividad, resultados y derivaciones.
- **Entrega:** el administrador copia un texto y lo envía **manualmente** por WhatsApp o correo. La aplicación registra el canal y estado de entrega solamente cuando el operador lo confirma.
- No hay CRM cliente, envíos automáticos, integraciones API ni ventas ficticias.

## Despliegue (sin alterar producción)

1. Respaldar la base de Supabase (el entorno Preview actual comparte la misma base con producción si las variables son iguales).
2. Crear rama **preview-v18** desde `preview-v17` en GitHub. Subir el contenido **interior** de `nawi-app/` al **root** del repositorio (conservar rutas). **No** reemplazar `main` todavía.
3. En Supabase → SQL Editor ejecutar **solo** `supabase/migrations/005_reports_portal_v18.sql` UNA VEZ. No ejecutar `schema.sql` ni reejecutar migraciones antiguas sin necesidad. La migración solo crea `nawi_admins`, `commercial_reports`, reglas RLS y una política adicional de lectura de empresas.
4. En Supabase → Authentication → Users, ubicar el correo de la cuenta Nawi que funcionó en v1.7; en SQL Editor ejecutar (sustituir correo):

```sql
insert into public.nawi_admins (user_id)
select id from auth.users
where lower(email)=lower('TU_CORREO_EXISTENTE@EJEMPLO.COM')
on conflict (user_id) do nothing;
```

   Para Diego, repetir con su correo de usuario Supabase (solo si ya existe). **No guardar claves ni contraseñas en SQL.**
5. Crear o seleccionar empresas desde el panel Nawi Admin. La función existente `create_organization` crea empresas y vincula al usuario que las creó.
6. Para que una cuenta cliente ya registrada vea **solo sus informes**, asociar al usuario a su empresa (desde SQL Editor; cambiar ambos identificadores):

```sql
insert into public.memberships(organization_id,user_id,role)
select o.id,u.id,'member'
from public.organizations o, auth.users u
where o.id = 'UUID-DE-LA-EMPRESA'::uuid
  and lower(u.email)=lower('CLIENTE@EJEMPLO.COM')
on conflict (organization_id,user_id) do nothing;
```

   No usar el rol `nawi_admins` para clientes. Si todavía no hay cuenta cliente, pedir que se registre primero en la app.
7. En Vercel verificar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en entorno **Preview**. Esta v1.8 **no requiere `ANTHROPIC_API_KEY` ni `SUPABASE_SERVICE_ROLE_KEY`**. La rama nueva debe generar un despliegue Preview. La versión de producción sigue en `main`.
8. Abrir Preview e iniciar sesión con cuenta admin; crear informe de empresa ficticia, guardar borrador, publicarlo, cerrar sesión; iniciar con usuario cliente asociado y verificar que solo ve informes de su empresa.
9. El mensaje de entrega utiliza el dominio del despliegue que se está visitando (`window.location.origin`). Para envíos reales usa un dominio estable que el cliente pueda abrir e iniciar sesión; el enlace no concede permisos por sí solo.

## Prueba rápida sugerida

- [ ] Admin ve las empresas existentes, cliente solo las suyas.
- [ ] Admin crea un informe diario con datos ficticios, lo guarda como borrador.
- [ ] Usuario cliente **no** ve ese borrador.
- [ ] Admin publica el informe; usuario cliente **sí** lo ve.
- [ ] Usuario de otra empresa **no** puede ver ese informe.
- [ ] Indicadores no comprobados quedan vacíos (se muestran con `—`, nunca como `0`).
- [ ] Admin copia el mensaje; el envío externo se realiza con aprobación humana.
- [ ] Admin registra que se envió solo después de confirmarlo.

## Costos

La aplicación no llama APIs de IA ni WhatsApp. Seguirán aplicando los precios y límites de **Vercel, Supabase y la suscripción compatible de Claude in Chrome**. Los envíos de correo y WhatsApp se realizan externamente y están sujetos a las políticas y límites de cada proveedor. No se prometen automatizaciones de envíos ni acceso a conversaciones históricas.

## Datos / privacidad

No pegar historiales completos ni información sensible de pacientes en informes; usar resúmenes anonimizados y datos mínimos. Los informes publicados son accesibles solo a miembros de la empresa correspondiente o a Nawi Admin mediante RLS. La cuenta administradora debe protegerse con MFA cuando sea posible. Los clientes no tienen permisos de escritura sobre informes.

## Estado de verificación

Código generado y comprobado sintácticamente con transpile TypeScript; **no** verificado mediante compilación Next.js completa ni pruebas end-to-end con un Supabase activo en este entorno. No afirmar que la versión está desplegada hasta probarla en Vercel.
