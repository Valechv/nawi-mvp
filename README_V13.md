# NAWI 1.3 — Claude + Gmail + WhatsApp Business (integraciones oficiales)

Esta versión amplía Nawi 1.2. **No elimina las tablas, las empresas ni los leads que ya existen.**

## Incluido y límites reales

- Claude: botón **Analizar nota** junto a cada lead. Se envía la nota comercial a la API de Anthropic y se devuelven señales de intención, urgencia, evidencia y acción sugerida. Solo completa intención/urgencia si estaban sin información; nunca marca ventas como ganadas, nunca envía mensajes.
- Gmail: OAuth de Google con permiso `gmail.readonly`, cifrado de refresh token en servidor (AES-256-GCM), sincronización manual de hasta diez correos recientes de entrada (siete días), deduplicación de mensajes. Opt-in independiente para analizar el texto de esos correos con Claude.
- WhatsApp: endpoint de webhook oficial verificado por token y firmado con `X-Hub-Signature-256`, capaz de guardar mensajes de texto nuevos en la empresa correspondiente. IA desactivada por defecto; el propietario puede activarla explícitamente en Nawi tras obtener permisos.
- Todas las rutas autenticadas validan usuario y membresía de empresa. No se exponen claves de proveedor al navegador. No se implementa todavía el envío de mensajes ni la lectura de historial de WhatsApp, ni un agente que controle WhatsApp Web.
- **Todavía no se ha validado la compilación Next.js ni conectado con cuentas externas reales**. Es código de integración para configurar y probar, no acreditación de una conexión ya autorizada.

## Actualizar sin perder datos

1. **Antes de cambios**, realiza una copia/exportación de respaldo de Supabase y conserva la versión anterior del repositorio (`main` o una etiqueta Git). Prueba en un proyecto de ensayo si vas a usar información real.
2. Si tu aplicación está en 1.1, ejecuta `supabase/migrations/002_auto_tasks.sql` en SQL Editor de **ese mismo proyecto**. Si ya la ejecutaste, no necesitas repetirla.
3. Ejecuta `supabase/migrations/003_integrations_ai.sql` en SQL Editor del mismo proyecto. No vuelvas a ejecutar `schema.sql`.
4. Sube el contenido del directorio `nawi-app/` al **mismo repositorio GitHub**. Lo ideal es hacerlo en rama `test-v13`, revisarlo con la URL Preview de Vercel y combinarlo con `main` cuando pase las pruebas.
5. Configura las siguientes variables en **Vercel → Project → Settings → Environment Variables**. Las nuevas variables son **solo de servidor**, no llevan `NEXT_PUBLIC_`:

| Variable | Procedencia y propósito |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya existe, URL base `https://...supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya existe, clave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → clave service_role / secret; **solo servidor**, nunca GitHub o navegador |
| `ANTHROPIC_API_KEY` | [Claude Console](https://console.anthropic.com/) → API Keys, con facturación disponible |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` (o un ID disponible para tu cuenta) |
| `NAWI_BASE_URL` | `https://nawi-mvp.vercel.app` (tu dominio real) |
| `NAWI_ENCRYPTION_KEY` | Clave aleatoria de 32 bytes en Base64. Genérala localmente con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` y almacénala SOLO en Vercel |
| `GOOGLE_CLIENT_ID` | Google Cloud Console, tipo cliente OAuth Web |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console, cliente OAuth Web, **solo servidor** |
| `META_APP_SECRET` | Meta for Developers → app settings → Basic → App secret |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Cadena aleatoria creada por ti y copiada también a Meta, **solo servidor** |

**Importante:** la clave `service_role` de Supabase permite saltarse RLS y es muy sensible. Las rutas que la usan validan permisos, pero antes de utilizar datos comerciales reales conviene realizar una revisión independiente de seguridad.

6. Tras cambiar variables, haz **Redeploy** del mismo proyecto. Las variables nuevas no se aplican a compilaciones anteriores.

## Probar Claude primero (sin conectar cuentas externas)

- Ve a **Leads**, abre uno ficticio, agrega la nota `Quisiera contratar el curso de SQL esta semana, ¿dónde pago?` y guarda.
- Pulsa **Analizar nota**. En **Conexiones e IA** se mostrará el resumen, urgencia, intención y acción. El algoritmo comercial reevalúa el lead automáticamente.
- Intenta con `Hola` y comprueba que Claude no invente intención ni urgencia.
- Revisa Logs en Vercel si recibes `Claude API: 401`, `429` o un error de presupuesto.

## Activar Gmail (después de probar Claude)

- En Google Cloud Console, crea un proyecto → habilita **Gmail API** → configura pantalla de consentimiento → agrega usuarios de prueba → crea un **OAuth Client ID**, tipo **Web application**.
- En **Authorized redirect URIs**, registra exactamente `https://nawi-mvp.vercel.app/api/integrations/gmail/callback`.
- La aplicación usa solo `https://www.googleapis.com/auth/gmail.readonly`, que es **un scope restringido**: Google puede exigir verificación y evaluación de seguridad para uso público, y el modo de prueba tiene límites. No conectes buzones reales de clientes sin cumplir esos requisitos.
- En Nawi → **Conexiones e IA → Conectar Gmail**, selecciona tu cuenta de prueba. Si Google no permite autorizar, verifica los usuarios de prueba, dominios y client ID. La función **Sincronizar últimos 10 correos** procesa manualmente mensajes entrantes recientes.
- No conectes buzones que contengan información de salud de pacientes u otra información sensible. Una cuenta piloto debe tener consentimiento/documentación para procesar datos comerciales.
- Si seleccionas el checkbox para IA, el texto de los mensajes sincronizados se enviará a Anthropic. Mantén esa opción desactivada si no tienes autorización expresa.

## Activar WhatsApp Business (requiere Meta)

- En Meta for Developers, crea una aplicación con WhatsApp Business Platform/Cloud API y consigue un **Phone Number ID** (número de prueba permitido).
- En Vercel configura `META_APP_SECRET` y `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; redeploy.
- En Nawi → **Conexiones e IA**, guarda el **Phone Number ID** de Meta para la empresa correcta. Eso solo crea el mapeo, **no conecta el número por sí solo**.
- En Meta configura Callback URL **`https://nawi-mvp.vercel.app/api/webhooks/whatsapp`** y Verify Token exactamente igual al de Vercel; suscríbete al campo `messages`.
- Prueba enviando un mensaje de texto al número de prueba desde un teléfono autorizado. En Nawi debería aparecer un lead nuevo de origen WhatsApp; al actualizar el panel se genera la tarea.
- No automatiza la aplicación WhatsApp Web, no lee mensajes históricos, no manda respuestas todavía. Meta puede exigir elegibilidad/verificación y cumplimiento de sus términos.
- Si activas IA para el canal, obtén el consentimiento antes de procesar mensajes; de otro modo, déjala apagada.

## Pruebas mínimas y seguridad

1. Correo/WhatsApp de una empresa no aparece en otra (dos usuarios y dos empresas).
2. Usuario de una empresa no puede activar canales de otra.
3. Reenviar el mismo webhook / sincronizar el mismo correo no crea un lead duplicado por evento.
4. Un simple `Hola` no implica `Compra explícita` ni `Inmediata`.
5. Los mensajes nunca se envían automáticamente.
6. Claves secretas nunca aparecen en el ZIP, frontend ni historial de Git.
7. Respaldar datos antes de ejecutar migraciones.
8. Validar con datos ficticios antes de una empresa real.

## Consideraciones de producción

Este prototipo no gestiona la verificación pública de OAuth, retención/borrado, exportación de solicitudes de privacidad ni un sistema de colas robusto para altos volúmenes. La sincronización de Gmail es manual; WhatsApp depende de webhooks. Para producción se recomienda revisión legal de protección de datos personales aplicable en Perú, auditoría de permisos/aislamiento por organización, rate limiting, rotación de claves, captura de errores y monitoreo. El sistema hace ingestión de mensajes y crea/actualiza contactos, pero **no demuestra por sí solo mejora en ventas**.

### Referencias oficiales
- Claude: https://platform.claude.com/docs/en/api/messages/create
- Gmail OAuth: https://developers.google.com/workspace/gmail/api/auth/web-server
- Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Meta webhooks: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/
