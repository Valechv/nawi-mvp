# NAWI v2.0 — Portal de informes, evidencias de los dos pilotos

Esta versión convierte los prototipos visuales de Nawi Admin en componentes reales React con datos agregados de referencia y tarjetas reproducibles en los informes publicados.

## Qué hay de nuevo

- Panel Levo: 75 conversaciones previas y 88 durante la gestión Nawi; mediana 9.5 h → 4.65 h; atención antes de 24 h 68.0% → 72.7%. Comparación descriptiva; no es experimento causal.
- Panel Mente Efectiva: diagnóstico **histórico anterior a Nawi** (585 leads, 210 contactados, 134 interesados, 51 ventas históricas), rotulado explícitamente como pre-Nawi.
- Vista de referencia de estos paneles para el ADMIN cuando se selecciona la organización correcta, incluso si todavía no se importó su informe. La referencia no crea reportes ni se muestra automáticamente a usuarios de empresa.
- Botón **Crear borrador con estos datos** dentro de la vista de referencia; o **Nuevo informe → Cargar informe Levo/Mente**.
- El informe guarda el `pilot_snapshot` con las tarjetas y metodología; la empresa podrá verlo únicamente cuando se publique tras revisión.
- RLS y separación entre organizaciones del portal v1.8/v1.9 se conservan. No se incorporan contactos personales, historial clínico ni nombres de empresas confidenciales.

## Instalación (Preview antes de Producción)

1. **Código:** sube el contenido de `nawi-app/` a una rama nueva del repositorio. Confirma que el proyecto Vercel apunte a la carpeta raíz de la app, o configura Root Directory si has cargado la carpeta contenedora.
2. **Variables en Vercel:** verifica `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para el entorno correspondiente. **No subas `.env.local` ni la llave `service_role`.** Revisa el archivo `.env.example` si también utilizas funcionalidades heredadas.
3. **Base de datos:** en Supabase SQL Editor ejecuta primero `005_reports_portal_v18.sql` si aún no está aplicada; después ejecuta **`006_pilot_evidence_v20.sql`**. Esta migración añade una columna JSONB y no borra registros.
4. **Acceso administrativo:** el administrador debe figurar en `public.nawi_admins` (según instrucciones de migración 005). No autorices como admin a una empresa.
5. **Organizaciones:** selecciona las organizaciones existentes o crea `Levo Learning` y `Mente Efectiva` si no existen. La vista de referencia aparece al seleccionar cada nombre (el nombre debe contener «Levo» o «Mente»).
6. **Publicación:** abre la empresa correcta → pulsa «Crear borrador con estos datos» → revisa las cifras, períodos y fuentes → «Guardar borrador». Abre el borrador y pulsa «Publicar» **solo con autorización**. Alternativamente el editor permite publicar tras revisión.
7. **Acceso de empresa:** crea una cuenta de prueba por cada organización y asocia el usuario mediante `memberships`, conforme a las reglas RLS existentes. Comprueba que cada cliente ve solo sus informes publicados.
8. **Pruebas mínimas:** revisa las tres pantallas: inicio Admin Levo, inicio Admin Mente y detalle del informe publicado como usuario de cada empresa; revisa responsive y cierre de sesión.

## Precisión de la evidencia

- Los 75 y 88 son tamaños de muestras de ventanas diferentes; no representan «75 leads atendidos por Nawi versus 88 leads atendidos por Nawi». **No** mostrar la diferencia como crecimiento atribuido a Nawi.
- El 51.1% es la reducción relativa de la mediana observada (9.5 a 4.65 h), sin atribución causal aislada.
- Las cifras de Mente corresponden a un período previo a Nawi. «No contesta» no debe interpretarse como «nunca gestionado».
- Esta versión no inventa cifras sobre leads sin gestión ni resultados comerciales no conciliados. Las otras dos empresas reportadas son confidenciales y no están incluidas.
- Las actividades e informes de ejemplo son borradores sujetos a revisión humana. El sistema NO envía mensajes automáticamente.

## Verificación en esta entrega

- Transpilación sintáctica de los principales archivos TypeScript/TSX: OK.
- Pruebas de consistencia de los snapshots (4 pruebas): OK.
- No se ejecutó `next build` completo ni integración real con Vercel/Supabase en este entorno porque no se dispone de los paquetes/credenciales. La instalación debe validarse en Preview antes de cambiar Producción.
