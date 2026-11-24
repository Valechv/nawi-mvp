# Cambios de Nawi 1.4

- Migración `004_operational_v14.sql`: programa de tareas, registros de salida, tokens cifrados, etiquetas de correo y verificación cruzada de empresa.
- Integración Claude: análisis individual con autorización explícita, análisis en lote (máximo 5) y borradores supervisados.
- Gmail: previsualizar remitente y asunto, seleccionar mensajes, importar con confirmación, desconectar/revocar acceso y sincronización diaria opcional de etiqueta comercial.
- WhatsApp: verificación de identidad del canal ante Meta Graph API, recepción de mensajes nuevos por webhook firmado, token de salida cifrado y envío de texto solo después de aprobación humana y ventana reciente de servicio.
- Vercel Cron: sincronización diaria de tareas y Gmail etiquetado opcional; protegido con `CRON_SECRET`.
- Pruebas unitarias: scoring y funciones aisladas de IA/cifrado. No reemplazan prueba integral de Next.js ni OAuth.

**Limitaciones:** no incluye navegación automatizada por WhatsApp Web, archivos históricos, bots que conversen solos, manejo de plantillas de WhatsApp fuera de ventana, verificación pública de Google, ni puesta en producción con credenciales reales. Los permisos externos se activan por cada negocio.
