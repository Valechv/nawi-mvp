# NAWI — MVP multiempresa (Next.js + Supabase)

Proyecto funcional inicial para crear empresas, leads, tareas, seguimiento, importar CSV, calcular prioridades y simular calificación guiada. **El simulador de bot NO es todavía una conexión a WhatsApp.** La conexión con Meta requiere credenciales y configuración adicional.

## Qué necesitas

- Cuenta gratuita en [Supabase](https://supabase.com/dashboard) para base de datos y autenticación.
- Cuenta en [GitHub](https://github.com/new) para almacenar el código.
- Cuenta en [Vercel](https://vercel.com/new) para publicarlo.
- Un navegador. **Node.js solo es necesario para probarlo en tu computadora**, no para desplegar desde Vercel.
- Para probar con datos reales: autorización de la empresa y revisión de tratamiento de datos personales. Comienza con datos ficticios.

## PASO 1 — Supabase (obligatorio)

1. En https://supabase.com/dashboard pulsa **New project**. Nombra el proyecto `nawi-mvp`, elige una región cercana, guarda la contraseña de la base de datos en un lugar seguro y crea el proyecto.
2. En el proyecto abre **SQL Editor > New query**.
3. Abre el archivo **`supabase/schema.sql`** de este ZIP; copia **todo** su contenido y pégalo en la consulta SQL. Pulsa **Run** **una sola vez**.
4. En **Table Editor**, verifica que existan `organizations`, `memberships`, `leads`, `activities` y `tasks`.
5. Ve a **Project Settings > API Keys** (o **Connect > API Keys**, según la interfaz). Copia dos valores: **Project URL** (por ejemplo `https://xxxxx.supabase.co`) y la clave **publishable/anon**. No copies la `service_role` ni ninguna secret key.
6. En **Authentication > Providers > Email**, verifica que Email esté habilitado. La confirmación por correo puede permanecer activada; al registrarte deberás confirmar tu email. Para pruebas locales también puedes crear un usuario de prueba desde Authentication > Users.

## PASO 2 — GitHub

1. Extrae este ZIP en tu computadora: debe quedar una carpeta `nawi-app` con `app/`, `components/`, `lib/`, `supabase/`, `package.json`, etc.
2. En https://github.com/new crea un repositorio privado llamado `nawi-mvp` sin añadir README inicial.
3. Sigue la opción **uploading an existing file** (Add file > Upload files). Arrastra **el contenido de la carpeta `nawi-app`, no el archivo ZIP**. Revisa que se suban las carpetas `app`, `components`, `lib`, `supabase` y `package.json`. Confirma con **Commit changes**.
4. ` .env.local` NO debe subirse a GitHub; no está incluido en el ZIP. Nunca compartas tus claves privadas.

Si GitHub web no admite una carpeta en tu navegador, usa **GitHub Desktop**: File > Add local repository (o Create repository from existing folder) y Publish repository (privado).

## PASO 3 — Vercel

1. En https://vercel.com/new elige **Import Git Repository** y selecciona `nawi-mvp`.
2. Framework: **Next.js**; Root Directory: raíz del repositorio, donde está `package.json`.
3. **Environment Variables**: agrega exactamente:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL copiada de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key / anon de Supabase |

   Marca Production, Preview y Development si la interfaz ofrece esos entornos.
4. Pulsa **Deploy**. Cuando esté publicado, abre la URL asignada (por ejemplo `https://nawi-mvp-xxxx.vercel.app`).
5. Si el sitio se construyó sin las variables, agrégalas en **Project > Settings > Environment Variables** y ejecuta **Redeploy** desde Deployments. Las variables `NEXT_PUBLIC_` se incluyen al compilar; por eso requieren un nuevo despliegue.

## PASO 4 — Autenticación Supabase

1. En Supabase ve a **Authentication > URL Configuration**.
2. Coloca la URL final de Vercel en **Site URL**.
3. Agrega `https://TU-DOMINIO.vercel.app/**` en **Redirect URLs** si usas confirmación de email o flujos de recuperación.
4. Desde tu sitio público pulsa **Registrarme**, escribe un correo y contraseña, confirma el correo si Supabase lo solicita y vuelve a iniciar sesión.
5. Crea una empresa, por ejemplo `Academia piloto`. Nawi vincula esa empresa al usuario que la creó.

## PASO 5 — Prueba completa (sin depender de Meta)

1. En **Configuración**, pulsa **Añadir cinco leads de ejemplo**.
2. En **Resumen** comprueba que aparezcan cinco leads, prioridades y alertas.
3. En **Leads** abre uno, cambia su estado e intención y guárdalo.
4. En **Acciones** genera una tarea para ese contacto y después márcala como completada.
5. En **Simulador bot**, escribe un nombre, elige curso y urgencia, y guarda: aparecerá un nuevo lead en Supabase.
6. En **Leads** usa **Importar CSV**. El archivo debe tener encabezados `nombre,telefono,correo,servicio`. Ejemplo en `ejemplo_leads.csv`. Importa como máximo 250 filas por archivo.
7. En **Configuración**, crea una segunda empresa. Cambia de empresa en el selector superior: los registros deben estar separados.
8. En `https://TU-SITIO.vercel.app/api/health` puedes comprobar que el servidor responde `status: ok`. Esto NO verifica por sí solo la conexión a Supabase; comprueba login y consultas reales.

## Qué es funcional y qué aún no

**Incluido y listo para pruebas con Supabase real:** alta/login con Supabase Auth, creación de organizaciones, separación multiempresa con RLS, leads, modificaciones, actividad, tareas, scoring por reglas, métricas, CSV y un simulador de bot que guarda respuestas.

**No incluido todavía:** conexión real de Meta Lead Ads, mensajería de WhatsApp Cloud API, lectura de conversaciones, envío automático, invitaciones a otros usuarios, autenticación de roles complejos, detección automática de duplicados, reintentos de webhooks y testing automatizado. No uses el MVP con datos personales reales hasta completar revisión de seguridad y privacidad.

## CSV mínimo

```csv
nombre,telefono,correo,servicio
Lead Prueba 1,999111222,prueba1@example.com,Power BI
Lead Prueba 2,999333444,prueba2@example.com,SQL
```

## Probar en tu computadora (opcional)

```bash
npm install
cp .env.example .env.local
# Editar .env.local y pegar las dos claves de Supabase
npm run dev
```

Abre http://localhost:3000. Para despliegue directo desde GitHub **no necesitas ejecutar estos comandos**.

## Errores habituales

- **«Faltan variables»**: revisa los nombres exactos en Vercel, guarda y vuelve a desplegar.
- **«relation does not exist» / «No se pudo consultar las empresas»**: vuelve al SQL Editor y confirma que `schema.sql` se ejecutó sin errores.
- **«Invalid login credentials»**: confirma email/contraseña y la activación por correo.
- **Usuarios pueden registrarse pero no crear empresa**: comprueba que existe `create_organization` y que se ejecutó la sección de permisos de `schema.sql`.
- **No se reflejan cambios en producción**: GitHub debe tener la versión actual; Vercel debe haber construido el último commit.

## Próximo incremento

Conectar WhatsApp Cloud API con un número de prueba y webhooks verificados; luego Meta Lead Ads. Esas integraciones implican permisos y se implementarán tras comprobar la base de Nawi desplegada.

## Revisión técnica — versión corregida

- El SQL puede reejecutarse sin fallar por políticas RLS o triggers ya existentes (no es una migración general para esquemas antiguos modificados).
- Se corrige la visualización de fecha/hora local del formulario de seguimiento.
- `last_contacted_at` solamente se asigna automáticamente cuando se registra expresamente el estado **Contactado**; cambiar a Ganado/Perdido no crea falsos contactos.
- El indicador de potencial comercial no inventa puntuaciones cuando faltan datos y excluye a contactos que declaran no tener interés.
- Las exportaciones CSV protegen contra fórmulas de hojas de cálculo y las importaciones se limitan a 2 MB y 250 filas por archivo.
- Se comprueba que cualquier usuario asignado a un lead pertenezca a la empresa correspondiente.

### Verificación y limitaciones

Se revisaron los archivos y se aplicaron comprobaciones estáticas. **No se ha podido completar `npm install`, `npm run build` ni una prueba contra una instancia real de Supabase en este entorno**, así que el primer despliegue requiere validar el resultado y, si aparece un error de build, compartir el log para corregirlo.

**Importante:** la aplicación no crea recordatorios programados ni contacta clientes automáticamente: muestra vencimientos y permite generar tareas. No se debe prometer un bot real hasta conectar WhatsApp Cloud API.
