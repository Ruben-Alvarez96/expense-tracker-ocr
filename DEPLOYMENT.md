# Guía de Despliegue en Render.com con Supabase

## Configuración Previa

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Una vez creado el proyecto, ve a Settings > Database y copia la **Connection string**
4. Ve a Settings > API y copia:
   - **Project URL** (será tu SUPABASE_URL)
   - **anon key** (será tu SUPABASE_ANON_KEY)
   - **service_role key** (será tu SUPABASE_SERVICE_ROLE_KEY)

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto usando `env.example` como referencia:

```bash
cp env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[TU-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[TU-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[TU-SUPABASE-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[TU-SUPABASE-SERVICE-ROLE-KEY]"

# OpenAI
OPENAI_API_KEY="[TU-OPENAI-API-KEY]"

# Cloudinary
CLOUDINARY_CLOUD_NAME="[TU-CLOUDINARY-CLOUD-NAME]"
CLOUDINARY_API_KEY="[TU-CLOUDINARY-API-KEY]"
CLOUDINARY_API_SECRET="[TU-CLOUDINARY-API-SECRET]"

# Authentication
JWT_SECRET="[UN-JWT-SECRETO-UNICO]"
NEXTAUTH_SECRET="[UN-NEXTAUTH-SECRETO-UNICO]"
NEXTAUTH_URL="https://[TU-APP-URL].onrender.com"
```

### 3. Configurar Base de Datos en Supabase

Ejecuta el siguiente comando para sincronizar el schema de Prisma con Supabase:

```bash
npx prisma db push
```

Luego ejecuta el seed para crear las categorías iniciales:

```bash
npx prisma db seed
```

## Despliegue en Render.com

### 1. Conectar tu Repositorio

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Conecta tu repositorio de GitHub/GitLab
3. Selecciona el repositorio `expense-tracker-ocr`

### 2. Configurar el Web Service

Render detectará automáticamente el archivo `render.yaml` y configurará:

- **Tipo**: Web Service
- **Entorno**: Node.js
- **Plan**: Free
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm start`

### 3. Configurar Variables de Entorno en Render

En el dashboard de Render, ve a tu servicio y agrega las siguientes variables de entorno:

```
NODE_ENV=production
DATABASE_URL=[TU-SUPABASE-CONNECTION-STRING]
SUPABASE_URL=[TU-SUPABASE-URL]
SUPABASE_ANON_KEY=[TU-SUPABASE-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[TU-SUPABASE-SERVICE-ROLE-KEY]
OPENAI_API_KEY=[TU-OPENAI-API-KEY]
CLOUDINARY_CLOUD_NAME=[TU-CLOUDINARY-CLOUD-NAME]
CLOUDINARY_API_KEY=[TU-CLOUDINARY-API-KEY]
CLOUDINARY_API_SECRET=[TU-CLOUDINARY-API-SECRET]
JWT_SECRET=[UN-JWT-SECRETO-UNICO]
NEXTAUTH_SECRET=[UN-NEXTAUTH-SECRETO-UNICO]
NEXTAUTH_URL=https://[TU-APP-URL].onrender.com
```

### 4. Despliegue

Una vez configuradas las variables, Render automáticamente:

1. Descargará tu código
2. Instalará dependencias con `pnpm install`
3. Construirá la aplicación con `pnpm run build`
4. Iniciará el servidor con `pnpm start`

## Verificación del Despliegue

1. Espera a que el build termine (puede tomar varios minutos en el plan free)
2. Visita la URL proporcionada por Render
3. Verifica que la aplicación carga correctamente
4. Prueba el registro/login para confirmar la conexión a Supabase

## Troubleshooting

### Error de Conexión a Base de Datos
- Verifica que la `DATABASE_URL` sea correcta
- Asegúrate de que las credenciales de Supabase sean válidas
- Confirma que el schema se sincronizó correctamente con `npx prisma db push`

### Error de Build
- Revisa el log de build en Render
- Asegúrate de que todas las dependencias están en `package.json`
- Verifica que las variables de entorno estén configuradas correctamente

### Error de OpenAI/Cloudinary
- Confirma que las API keys sean válidas
- Verifica que los servicios tengan los permisos necesarios

## Costos

- **Render.com**: Plan Free (disponible, pero con limitaciones)
- **Supabase**: Plan Free (hasta 500MB de base de datos, 50,000 usuarios/mes)
- **OpenAI**: Pago por uso (OCR con GPT-4o Vision)
- **Cloudinary**: Plan Free (25 créditos/mes)

## Actualizaciones Futuras

Para actualizar la aplicación:

1. Haz push a tu repositorio
2. Render automáticamente detectará los cambios y redeployará
3. Si modificaste el schema de la base de datos, ejecuta `npx prisma db push` localmente y luego haz deploy
