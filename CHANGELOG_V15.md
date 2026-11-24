# NAWI v1.5 — Auditoría UX/UI y consistencia funcional

## Cambios realizados
- Guía inicial vacía enfocada en importar la base comercial, no en formularios.
- Priorización presentada correctamente como urgencia operativa, no probabilidad de compra.
- Registro explícito de contacto real; actualizar el estado o escribir notas ya no falsifica la métrica «contactados».
- Tareas segmentadas en pendientes y completadas, con control para mostrar ambas.
- Selección de leads y consentimiento de IA reiniciados al cambiar de empresa.
- Prevención de duplicados CSV por **ambos** identificadores, correo y teléfono.
- El límite de 250 filas CSV ahora informa un error en lugar de truncar la importación silenciosamente.
- Advertencias de estado real de integraciones, flujo guiado y mejor accesibilidad visual y responsividad.
- Datos demo requieren confirmación explícita para reducir inserciones accidentales.
- Validaciones de valores y fechas del formulario.

## Alcance y límites
No se alteran tablas ni se ejecutan migraciones nuevas. Es un reemplazo del código sobre el schema v1.4. Debe probarse mediante una rama/preview de Vercel antes de pasar a producción. La compilación real y las credenciales de Meta, Google y Anthropic requieren validación externa.
