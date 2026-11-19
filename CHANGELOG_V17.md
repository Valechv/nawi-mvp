# Nawi v1.7 — Diagnóstico y recuperación comercial

Basado en v1.5: no se incorpora el módulo de invitaciones v1.6. Una cuenta por empresa sigue siendo suficiente en el flujo principal, con la separación de datos por organización existente.

## Cambios
- Inicio → **Diagnóstico comercial**, con señales observadas y explicaciones no predictivas.
- **Recuperación** → bandeja filtrable: Atender ahora, Recuperar, Por calificar, Programados; explicaciones auditables y acción propuesta.
- **Resultados** → indicadores descriptivos, embudo y advertencia explícita de no atribución causal.
- `lib/diagnostic.ts`: lógica de grupos y evidencia sin interpretar notas automáticamente.
- Ninguna tabla nueva; se mantienen las migraciones 002, 003 y 004. No ejecutar schema.sql otra vez.

## Límites de esta versión
- No se interpreta el texto de WhatsApp automáticamente si Meta no está conectado.
- Claude solo analiza notas mediante funciones de IA ya preparadas, con credenciales y consentimiento.
- No se afirma que un contacto se haya recuperado comercialmente por aparecer en la bandeja.
- La integración histórica de WhatsApp Coexistence no está incluida.
- Pruebas con proveedores externos y compilación de producción deben realizarse en un entorno con dependencias instaladas.
