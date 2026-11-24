# Nawi v1.4 — IA, Gmail y WhatsApp: instalación y pruebas

## Qué está implementado en código

1. **Scoring existente:** prioridad operativa y potencial experimental, separados.
2. **Claude (Anthropic API):** analizar notas individuales o hasta cinco seleccionadas; extraer señales sin completar datos desconocidos; preparar **borradores para revisión humana**.
3. **Gmail (Google OAuth):** conectar con permiso `gmail.readonly`, vista previa remitente/asunto, elegir hasta diez correos comerciales para importar, desconectar y revocar permiso. Alternativamente, el propietario puede habilitar una revisión diaria de **solo una etiqueta específica** mediante Vercel Cron; desactivada por defecto. Activar Claude para correos es un consentimiento separado.
4. **WhatsApp Business Cloud API (Meta):** recibir mensajes nuevos mediante webhook firmado; asociarlos con la empresa correcta; verificar el Phone Number ID y token oficial antes de registrar; analizar nuevos mensajes con Claude solo si el propietario habilita esa opción; generar borradores; **enviar solamente tras clic de aprobación humana**, con token cifrado y conversación reciente iniciada por el cliente. No hay chatbot autónomo ni acceso a WhatsApp Web o historial.
5. **Tareas:** sincronización al entrar al panel y proceso diario de Vercel Cron protegido con `CRON_SECRET`.
6. **Seguridad básica:** comprobación de usuario/empresa en endpoints, claves solo en servidor, token Gmail y Meta cifrados en reposo, RLS en la base, no duplicación de eventos por ID del proveedor.

## Qué NO puede garantizarse todavía

- **No está activado en las cuentas reales.** Faltan claves, OAuth, autorización de Meta y pruebas de extremo a extremo.
- **No se pudo completar `npm install` / `next build` en el entorno donde se generó.** Sí pasaron pruebas de unidad del motor y el parser de TypeScript; prueba el *Preview deployment* antes de combinar con `main`.
- Gmail usa un **scope restringido** que puede exigir verificación de Google y evaluación de seguridad para una app pública. En modo Testing, configura los usuarios de prueba; revisa también vencimiento de refresh tokens de apps de prueba.
- Meta puede exigir verificación de empresa/permiso, número autorizado y una sesión de atención vigente; no se envían plantillas fuera de la ventana. Cifrar tokens no sustituye una auditoría de seguridad.
- Para operar con datos reales se necesitan permisos y contratos de tratamiento de datos apropiados, política de privacidad y retención, evaluación legal peruana, pruebas de segregación de empresas, monitoreo, límites de gasto de API y protección contra abuso. No procesar historiales clínicos de centros psicológicos.

## Pasos para actualizar tu proyecto existente

**Antes de ejecutar SQL:** haz un respaldo desde Supabase. No ejecutes nuevamente `schema.sql` ni borres tablas.

1. Identifica migraciones ya ejecutadas. Si tu Supabase está solo en v1.1, ejecuta `supabase/migrations/002_auto_tasks.sql`; después `003_integrations_ai.sql`; finalmente `004_operational_v14.sql`. Si ejecutaste 002 y 003 previamente, ejecuta **solamente 004**. Ejecuta cada archivo completo en SQL Editor y comprueba `Success`.
2. Crea en GitHub una **rama `nawi-v14-pruebas`** desde `main`. Copia a la raíz del repositorio **el contenido** de esta carpeta `nawi-app`, no una carpeta anidada. Haz Commit.
3. En Vercel se creará una **Preview Deployment** para esa rama. No reemplaces la producción hasta que compile y pasen las pruebas. Configura variables de prueba si se requieren.
4. En **Vercel → Settings → Environment Variables**, mantén las públicas actuales y añade **sin `NEXT_PUBLIC_`** las claves privadas listadas abajo. No pegues los valores secretos en un chat ni en GitHub.
5. Agrega/actualiza variables y vuelve a desplegar el Preview. Abre logs de Vercel si falla. Comprueba empresa, leads, tareas, Claude (datos ficticios), Gmail OAuth y webhook de prueba. Solo después combina la rama a `main`.

### Variables Vercel

| Variable | Qué introducir |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya existente: `https://...supabase.co` sin `/rest/v1` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública existente de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave *secret/service_role* de Supabase. **Solo servidor**, necesaria para integraciones y cron |
| `ANTHROPIC_API_KEY` | Clave API de Anthropic Console, con facturación propia |
| `CLAUDE_MODEL` | Un ID disponible en tu cuenta, p. ej. `claude-sonnet-4-6` |
| `NAWI_BASE_URL` | URL exacta donde haces OAuth, p. ej. `https://nawi-mvp.vercel.app` (en Preview, cambiar a URL Preview) |
| `NAWI_ENCRYPTION_KEY` | 32 bytes base64. Generar localmente con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GOOGLE_CLIENT_ID` | OAuth Web Client ID de Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Secreto OAuth Web de Google Cloud |
| `META_APP_SECRET` | Secreto de la aplicación Meta for Developers |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Cadena propia aleatoria igual en Vercel y Meta |
| `META_GRAPH_VERSION` | Opcional; Graph API compatible con tu app, por defecto `v23.0` |
| `CRON_SECRET` | Cadena larga aleatoria: autoriza `/api/cron/tasks` |

### Gmail

1. Google Cloud → habilitar **Gmail API**, configurar marca/consentimiento y usuarios de prueba; crear cliente OAuth de tipo aplicación web.
2. Registrar **Authorized redirect URI** exactamente `https://nawi-mvp.vercel.app/api/integrations/gmail/callback` (para pruebas agrega también URI de Preview configurado).
3. En Nawi → *Conexiones e IA* → Conectar Gmail. El permiso solicitado es `gmail.readonly`.
4. Elegir **Ver correos candidatos**, revisar remitentes/asuntos y seleccionar **solo mensajes comerciales autorizados**; confirmar y pulsar Importar. El envío a Anthropic requiere otro consentimiento.
5. Automatización opcional: crea en Gmail una **etiqueta `NawiVentas`**, aplícala solo a correos comerciales aptos y habilítala en Nawi. El cron examina hasta cinco correos etiquetados por empresa en cada ejecución, tres empresas por ejecución (límite de seguridad/recursos del prototipo). Las cuentas de prueba de Google pueden tener restricciones de duración de tokens.
6. Para desconectar, pulsa *Desconectar* en Nawi; también puedes revocar el acceso desde tu cuenta Google.

### WhatsApp Cloud API

1. Crear una aplicación Meta Business con WhatsApp Cloud API y obtener **Phone Number ID** y **token oficial** con acceso permitido.
2. Agregar el token desde Nawi → Conexiones e IA. El backend verifica el ID llamando a Graph API antes de asociarlo a una empresa. El token se cifra, nunca vuelve al navegador.
3. En Meta configurar webhook `https://nawi-mvp.vercel.app/api/webhooks/whatsapp`, token de verificación igual que en Vercel, suscribirse a `messages`.
4. Enviar un mensaje de **texto nuevo** desde teléfono autorizado al número de prueba. Comprobar que aparezca el lead. El webhook exige la firma `X-Hub-Signature-256`.
5. Para generar un borrador, habilitar autorización de Claude, entrar a *Leads* → *Borrador*. El vendedor **edita, revisa y confirma** antes de pulsar *Enviar por API oficial*. El backend exige una interacción entrante de WhatsApp reciente (margen de 23 h), teléfono válido, lead activo y token configurado. Meta puede denegar el envío si la ventana ya cerró.
6. **No se soporta automatización de WhatsApp Web**, lectura de mensajes antiguos ni envío de plantillas fuera de la ventana de atención.

### Tareas diarias

`vercel.json` programa `/api/cron/tasks` diariamente a las **13:00 UTC (08:00 Lima)**. En Vercel define `CRON_SECRET`. La frecuencia y disponibilidad reales dependen de los límites de tu plan. Con la automatización de Gmail desactivada, el cron solo revisa tareas. Si se activa Gmail, importa correos de la etiqueta especificada y reevalúa tareas.

### Pruebas mínimas de aceptación

- [ ] Preview compila en Vercel (`Ready`, sin errores de TypeScript en Build Logs).
- [ ] Inicio de sesión y dos empresas con miembros/datos aislados.
- [ ] Lead con mensaje `Hola` conserva potencial *Por calificar*.
- [ ] El botón IA solo funciona tras el consentimiento y solo completa campos desconocidos.
- [ ] Borrador no envía nada hasta marcar aprobación y pulsar Enviar.
- [ ] Correo no seleccionado no se importa. Sincronización repetida no duplica el mismo mensaje.
- [ ] Gmail desconectado no puede seguir sincronizando.
- [ ] Evento Meta sin firma válida devuelve 401; evento nuevo firmado se guarda una sola vez.
- [ ] WhatsApp no envía fuera de la ventana permitida.
- [ ] Tareas aparecen sin duplicarse tras recarga y con el cron autenticado.
- [ ] No hay secretos en código público, GitHub o variables `NEXT_PUBLIC_`.

### Tests locales

Con Node 22: `npm test`. Para compilar realmente: `npm install`, `npm run lint`, `npm run build`. Si tu entorno no puede instalar dependencias, usa los logs de Vercel como prueba de compilación.

### Referencias

- [Google: Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google: verificación de scopes restringidos](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)
- [Meta: recepción de mensajes Cloud API](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/receivingMessages/)
- [Anthropic: Messages API](https://platform.claude.com/docs/en/api/messages)
