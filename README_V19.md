# Nawi v1.9 — pilotos Levo y Mente Efectiva

Incluye las dos empresas como plantillas de informes comerciales **no publicados automáticamente**. Continúa el modelo de servicio asistido por IA con plataforma de informes, sin CRM para clientes.

## Uso

1. Sigue `NAWI_V1_8_DESPLIEGUE_RAPIDO.md` para crear una rama Preview y aplicar la migración `005_reports_portal_v18.sql` una sola vez (si no se aplicó antes).
2. Accede como administrador a Nawi, crea o selecciona una organización cuyo nombre incluya **Levo** o **Mente**. Antes de crearla verifica que no exista ya para evitar duplicados.
3. Haz clic en **Nuevo informe** y pulsa **Cargar informe Levo** o **Cargar informe Mente Efectiva**.
4. Comprueba cifras, período y fuentes. No publiques informes de prueba a usuarios reales sin autorización. Guarda borrador, revisa y publica cuando corresponda.
5. Para el cliente, vincula únicamente a su organización por `memberships`; los informes publicados se filtran por organización mediante RLS.

## Qué contiene cada plantilla

- **Levo**: resultados documentados de campañas Brevo y acciones asistidas, además de una comparación descriptiva del tiempo de respuesta. Diferencia marcas de venta de pagos confirmados.
- **Mente Efectiva**: antecedentes históricos (585 leads; 210 contactados; 134 interesados; 51 ventas entre enero y junio) y acciones de análisis/propuestas. **NO** transforma esas cifras históricas en resultados obtenidos por Nawi. Reconoce el inicio de gestión conjunta en octubre, pero deja sin cuantificar actividades no documentadas.

## Seguridad y limitaciones

No contiene contactos, teléfonos ni datos clínicos. No se crearon ventas, citas, derivaciones o campañas ficticias. No añade APIs pagadas. No modifica producción por sí mismo ni ejecuta migraciones automáticamente. No está validado en un entorno Vercel/Supabase real: validar Preview y roles primero.
