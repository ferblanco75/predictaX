# Guía de Deployment - PredictaX

Esta guía detalla el proceso completo para deployar PredictaX en producción usando Vercel con un dominio custom (neuropredict.app).

## 📋 Tabla de Contenidos

- [Prerequisites](#prerequisites)
- [Paso 1: Configuración de Servicios Externos](#paso-1-configuración-de-servicios-externos)
- [Paso 2: Configuración de Vercel](#paso-2-configuración-de-vercel)
- [Paso 3: Variables de Entorno](#paso-3-variables-de-entorno)
- [Paso 4: Configuración de Dominio Custom](#paso-4-configuración-de-dominio-custom)
- [Paso 5: Deployment](#paso-5-deployment)
- [Paso 6: Verificación Post-Deploy](#paso-6-verificación-post-deploy)
- [Troubleshooting](#troubleshooting)
- [Deployment Alternativo con Docker](#deployment-alternativo-con-docker)

---

## Prerequisites

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de Vercel ([vercel.com/signup](https://vercel.com/signup))
- ✅ Dominio neuropredict.app comprado y acceso al panel DNS
- ✅ Repositorio GitHub con el código de PredictaX
- ✅ Cuentas configuradas en:
  - [Google Analytics](https://analytics.google.com)
  - [Sentry](https://sentry.io)
  - [Resend](https://resend.com)

---

## Paso 1: Configuración de Servicios Externos

### 1.1 Google Analytics 4

1. Ve a [Google Analytics](https://analytics.google.com)
2. Crea una nueva propiedad llamada "PredictaX"
3. Selecciona "Web" como plataforma
4. Copia el **Measurement ID** (formato: `G-XXXXXXXXXX`)
5. Guárdalo para usarlo en las variables de entorno

### 1.2 Sentry (Error Tracking)

1. Ve a [Sentry.io](https://sentry.io/signup/)
2. Crea una nueva organización
3. Crea un proyecto:
   - **Platform**: Next.js
   - **Project Name**: predictax-frontend
4. Copia el **DSN** (formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
5. Ve a **Settings → Auth Tokens** y crea un token con permisos `project:releases`
6. Guarda:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`

### 1.3 Resend (Email Service)

1. Ve a [Resend](https://resend.com/signup)
2. Verifica tu email
3. Ve a **API Keys** y crea una nueva API key
4. Copia la API key (formato: `re_xxxxx`)
5. **Opcional**: Verifica tu dominio custom para enviar desde `noreply@neuropredict.app`
   - Por ahora puedes usar `onboarding@resend.dev` (gratuito)

---

## Paso 2: Configuración de Vercel

### 2.1 Conectar Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..." → Project**
3. Selecciona tu repositorio de GitHub `predictaX`
4. Configura el proyecto:
   - **Framework Preset**: Next.js (auto-detectado)
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build` (auto-detectado)
   - **Output Directory**: `.next` (auto-detectado)
   - **Install Command**: `npm install` (auto-detectado)

### 2.2 Configurar Build Settings

En la sección de configuración del proyecto:

```bash
Framework: Next.js
Root Directory: frontend
Node.js Version: 20.x
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

**NO HACER DEPLOY TODAVÍA** - Primero configuramos las variables de entorno.

---

## Paso 3: Variables de Entorno

### 3.1 Agregar Variables en Vercel

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en **Settings → Environment Variables**
3. Agrega las siguientes variables para **Production**:

#### Variables Requeridas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://neuropredict.app` | URL base de la aplicación |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Google Analytics Measurement ID |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` | Sentry DSN |
| `SENTRY_ORG` | `tu-org` | Organización de Sentry |
| `SENTRY_PROJECT` | `predictax-frontend` | Proyecto de Sentry |
| `SENTRY_AUTH_TOKEN` | `tu-token` | Token de autenticación de Sentry |
| `RESEND_API_KEY` | `re_xxxxx` | API key de Resend |
| `WAITLIST_EMAIL_TO` | `tu-email@example.com` | Email donde recibirás las notificaciones de waitlist |

#### Cómo Agregar Variables

1. Click en **Add New**
2. Ingresa el **Name** (nombre de la variable)
3. Ingresa el **Value** (valor)
4. Selecciona **Production** (y opcionalmente Preview/Development)
5. Click en **Save**

### 3.2 Variables Locales

Para desarrollo local, crea `.env.local`:

```bash
cd frontend
cp .env.example .env.local
# Edita .env.local con tus valores reales
```

---

## Paso 4: Configuración de Dominio Custom

### 4.1 Agregar Dominio en Vercel

1. En Vercel Dashboard → tu proyecto
2. Ve a **Settings → Domains**
3. Click en **Add Domain**
4. Ingresa: `neuropredict.app`
5. Click en **Add**

Vercel te mostrará los DNS records que necesitas configurar.

### 4.2 Configurar DNS

Ve al panel de administración de tu dominio (ej: GoDaddy, Namecheap, Cloudflare) y configura:

#### Opción A: DNS Records Estándar

```
Type    Name    Value                    TTL
A       @       76.76.21.21              Auto
CNAME   www     cname.vercel-dns.com     Auto
```

#### Opción B: Si usas Cloudflare

```
Type    Name    Value                    Proxy Status
A       @       76.76.21.21              Proxied (naranja)
CNAME   www     neuropredict.app         Proxied (naranja)
```

### 4.3 Configurar www Redirect

En Vercel:

1. Después de agregar `neuropredict.app`
2. Agrega también `www.neuropredict.app`
3. Vercel automáticamente redirigirá www → non-www

### 4.4 Verificación DNS

1. **Espera la propagación DNS** (15 minutos - 48 horas)
2. Verifica la propagación en [dnschecker.org](https://dnschecker.org)
3. Ingresa `neuropredict.app` y verifica que los records A y CNAME estén correctos

### 4.5 SSL Certificate

✅ **Automático con Vercel**

- Vercel provisiona automáticamente un certificado SSL Let's Encrypt
- El certificado se renueva automáticamente
- HTTPS se fuerza por defecto
- No requiere configuración manual

---

## Paso 5: Deployment

### 5.1 Deploy Inicial

Una vez configuradas las variables de entorno y el dominio:

1. En Vercel Dashboard → tu proyecto
2. Click en **Deployments**
3. Click en **Create Deployment**
4. Selecciona la rama `main` o `master`
5. Click en **Deploy**

El proceso de build tomará ~2-3 minutos.

### 5.2 Monitorear el Build

1. Vercel mostrará logs en tiempo real
2. Si hay errores, revisa:
   - Variables de entorno
   - Logs de build
   - Vercel Function logs

### 5.3 Deploy Automático

Una vez configurado, cada push a `main` desplegará automáticamente:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# Vercel detecta el push y deploya automáticamente
```

---

## Paso 6: Verificación Post-Deploy

### 6.1 Checklist de Funcionalidad

Accede a `https://neuropredict.app` y verifica:

- [ ] ✅ HTTPS funciona (candado verde en el navegador)
- [ ] ✅ Página principal (`/`) carga correctamente
- [ ] ✅ Página About (`/about`) carga correctamente
- [ ] ✅ Página Waitlist (`/waitlist`) carga correctamente
- [ ] ✅ Formulario de waitlist funciona (enviar y recibir email)
- [ ] ✅ Navegación entre páginas funciona
- [ ] ✅ Links del Footer funcionan
- [ ] ✅ Dark mode funciona
- [ ] ✅ Responsive design en móvil/tablet/desktop

### 6.2 Verificar Analytics

#### Google Analytics 4

1. Ve a [Google Analytics](https://analytics.google.com)
2. Selecciona tu propiedad "PredictaX"
3. Ve a **Reports → Realtime**
4. Navega en tu sitio y verifica que aparezcan los pageviews en tiempo real
5. Envía el formulario de waitlist y verifica el evento `waitlist_joined`

#### Vercel Analytics

1. En Vercel Dashboard → tu proyecto
2. Ve a la pestaña **Analytics**
3. Espera unos minutos para ver datos
4. Verifica métricas de performance y pageviews

#### Sentry (Error Tracking)

1. Ve a [Sentry Dashboard](https://sentry.io/)
2. Selecciona tu proyecto `predictax-frontend`
3. Verifica que no haya errores críticos
4. Para probar, puedes forzar un error de prueba (opcional)

### 6.3 Performance Check

1. Ve a [PageSpeed Insights](https://pagespeed.web.dev/)
2. Ingresa `https://neuropredict.app`
3. Verifica scores:
   - **Performance**: > 90
   - **Accessibility**: > 90
   - **Best Practices**: > 90
   - **SEO**: > 90

### 6.4 Social Media Preview

1. Ve a [Open Graph Debugger](https://www.opengraph.xyz/)
2. Ingresa `https://neuropredict.app`
3. Verifica que se muestre correctamente:
   - Título
   - Descripción
   - Imagen OG (si tienes)

---

## Troubleshooting

### Problema: Analytics no aparece en GA4

**Síntomas**: No se ven pageviews en Google Analytics

**Soluciones**:
1. Verifica que `NEXT_PUBLIC_GA_MEASUREMENT_ID` esté configurado en Vercel
2. Confirma que `NODE_ENV=production` en Vercel
3. Espera 24-48 horas para que aparezcan los primeros datos
4. Verifica en modo Realtime en GA4
5. Revisa Vercel Function Logs:
   - Vercel Dashboard → Deployments → (último deploy) → Functions
   - Busca errores relacionados con gtag

### Problema: Emails de waitlist no llegan

**Síntomas**: El formulario se envía pero no recibes emails

**Soluciones**:
1. Verifica que `RESEND_API_KEY` esté configurado correctamente
2. Verifica que `WAITLIST_EMAIL_TO` tenga tu email correcto
3. Revisa Resend Dashboard → Logs:
   - [https://resend.com/logs](https://resend.com/logs)
   - Busca el email y verifica el estado
4. Revisa tu carpeta de Spam
5. Si usas `onboarding@resend.dev`, considera verificar tu dominio custom

### Problema: Sentry no captura errores

**Síntomas**: No aparecen errores en Sentry Dashboard

**Soluciones**:
1. Verifica que `NEXT_PUBLIC_SENTRY_DSN` esté configurado
2. Confirma que `enabled: NODE_ENV === 'production'` en sentry configs
3. Fuerza un error de prueba:
   ```javascript
   throw new Error('Test error');
   ```
4. Revisa Sentry Dashboard → Settings → Projects → Inbound Filters
5. Verifica que el proyecto esté activo y no en modo "disabled"

### Problema: Dominio no resuelve

**Síntomas**: `neuropredict.app` no carga o muestra error de DNS

**Soluciones**:
1. Verifica DNS con [https://dnschecker.org](https://dnschecker.org)
2. Espera hasta 48 horas para propagación completa
3. Revisa records A y CNAME en tu registrar de dominio
4. Mientras tanto, usa la URL de Vercel: `https://predictax-frontend.vercel.app`
5. Si usas Cloudflare, verifica que el proxy esté activado (naranja)
6. Verifica que el dominio esté verificado en Vercel Dashboard

### Problema: Build falla en Vercel

**Síntomas**: El deploy falla con errores de compilación

**Soluciones**:
1. Verifica que `npm run build` funcione localmente:
   ```bash
   cd frontend
   npm run build
   ```
2. Revisa las variables de entorno en Vercel
3. Check Vercel Build Logs para el error específico
4. Confirma que Root Directory sea `./frontend`
5. Verifica que todas las dependencias estén en `package.json`
6. Si Sentry causa problemas, temporalmente comenta el `withSentryConfig` en `next.config.ts`

### Problema: Páginas cargan lento

**Síntomas**: Performance score bajo en PageSpeed

**Soluciones**:
1. Verifica que las imágenes estén optimizadas
2. Usa Next.js Image optimization (`next/image`)
3. Reduce bundle size:
   ```bash
   npm run build
   # Revisa el tamaño de los bundles
   ```
4. Habilita caching en Vercel
5. Considera usar ISR (Incremental Static Regeneration) para páginas que cambian poco

---

## Deployment Alternativo con Docker

Si prefieres hacer deploy en tu propio servidor (VPS) usando Docker:

### 1. Preparar el Servidor

```bash
# En tu VPS (Ubuntu 22.04)
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/predictaX.git
cd predictaX
```

### 3. Crear .env

```bash
cd frontend
cp .env.example .env
nano .env  # Edita con tus valores de producción
```

### 4. Build y Deploy con Docker Compose

```bash
cd ..
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Configurar Nginx como Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/predictax
```

Agrega:

```nginx
server {
    listen 80;
    server_name neuropredict.app www.neuropredict.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el site:

```bash
sudo ln -s /etc/nginx/sites-available/predictax /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configurar SSL con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d neuropredict.app -d www.neuropredict.app
```

Certbot configurará automáticamente SSL y HTTPS redirect.

### 7. Auto-renovación de SSL

```bash
sudo certbot renew --dry-run
```

---

## Siguiente Pasos

### Monitoreo Continuo

1. **Week 1**: Revisar analytics y errores diariamente
2. **Week 2-4**: Revisar semanalmente
3. **Monthly**: Performance audits con Lighthouse
4. **Quarterly**: Actualizar dependencias

### Mejoras Futuras

- [ ] Configurar dominio verificado en Resend para emails desde `noreply@neuropredict.app`
- [ ] Agregar robots.txt y sitemap.xml
- [ ] Configurar alertas en Sentry para errores críticos
- [ ] Optimizar imágenes con next/image
- [ ] Configurar CDN adicional si es necesario
- [ ] Agregar meta tags adicionales para SEO
- [ ] Configurar Google Search Console
- [ ] Implementar Service Worker para PWA

---

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Resend](https://resend.com/docs)
- [Documentación de Sentry](https://docs.sentry.io/)
- [Guía de Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)

---

## Soporte

Si tienes problemas durante el deployment:

1. Revisa los logs de Vercel
2. Consulta esta guía de troubleshooting
3. Revisa el [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. Contacta al equipo de desarrollo

---

**Última actualización**: Marzo 2026
**Mantenido por**: Equipo PredictaX
