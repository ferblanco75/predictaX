# Deployment Checklist - PredictaX

Usa este checklist para asegurar un deployment exitoso. Marca cada item cuando esté completo.

---

## 📦 Pre-Deployment Checklist

### Código y Build

- [ ] `npm run build` funciona sin errores localmente
- [ ] `npm run lint` no muestra errores críticos
- [ ] Todos los tests pasan (si aplica)
- [ ] No hay `console.log` o `console.error` innecesarios en el código
- [ ] Código mergeado a rama `main` o `master`

### Configuración

- [ ] `.env.example` actualizado con todas las variables necesarias
- [ ] `.env.local` configurado correctamente para desarrollo
- [ ] Variables de entorno sensibles NO están commiteadas
- [ ] `vercel.json` configurado correctamente
- [ ] `next.config.ts` con configuración de Sentry

### Analytics & Monitoring

- [ ] Google Analytics 4 configurado
  - [ ] Propiedad creada
  - [ ] Measurement ID obtenido
- [ ] Vercel Analytics listo (automático en Vercel)
- [ ] Sentry configurado
  - [ ] Proyecto creado
  - [ ] DSN obtenido
  - [ ] Auth token generado
- [ ] Resend configurado
  - [ ] Cuenta creada
  - [ ] API key generada
  - [ ] Email de destino configurado

### Content

- [ ] Página `/` (home) completa
- [ ] Página `/about` completa
- [ ] Página `/waitlist` completa
- [ ] Página `/markets` funcional
- [ ] Página `/markets/[id]` funcional
- [ ] Footer links funcionan
- [ ] Navbar links funcionan

### SEO & Metadata

- [ ] Metadata configurada en todas las páginas
- [ ] Open Graph tags en todas las páginas principales
- [ ] Twitter Card tags configurados
- [ ] Favicon presente (`/public/favicon.ico`)
- [ ] `robots.txt` configurado (opcional)
- [ ] Sitemap generado (opcional)

### Performance

- [ ] Imágenes optimizadas con `next/image`
- [ ] Bundle size verificado (debe ser < 500KB first load JS)
- [ ] Lighthouse score local > 90 en todas las categorías
- [ ] No hay warnings críticos en la consola del navegador

---

## 🚀 Deployment Steps

### Vercel Configuration

- [ ] Cuenta de Vercel creada
- [ ] Repositorio GitHub conectado a Vercel
- [ ] Proyecto creado en Vercel Dashboard
- [ ] Root directory configurado: `./frontend`
- [ ] Build settings verificados:
  - [ ] Framework: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm install`

### Environment Variables en Vercel

Agregar estas variables en **Settings → Environment Variables** para **Production**:

- [ ] `NEXT_PUBLIC_BASE_URL` = `https://neuropredict.app`
- [ ] `NODE_ENV` = `production`
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` = `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- [ ] `SENTRY_ORG` = `tu-org`
- [ ] `SENTRY_PROJECT` = `predictax-frontend`
- [ ] `SENTRY_AUTH_TOKEN` = `tu-token`
- [ ] `RESEND_API_KEY` = `re_xxxxx`
- [ ] `WAITLIST_EMAIL_TO` = `tu-email@example.com`

### Domain Configuration

- [ ] Dominio `neuropredict.app` comprado
- [ ] Dominio agregado en Vercel Dashboard
- [ ] DNS Records configurados:
  - [ ] A record: `@` → `76.76.21.21`
  - [ ] CNAME record: `www` → `cname.vercel-dns.com`
- [ ] DNS propagación verificada en [dnschecker.org](https://dnschecker.org)
- [ ] SSL certificate automático de Vercel activo

### First Deployment

- [ ] Variables de entorno configuradas
- [ ] Dominio configurado y verificado
- [ ] Deploy ejecutado desde Vercel Dashboard
- [ ] Build logs revisados (sin errores)
- [ ] Deploy exitoso confirmado

---

## ✅ Post-Deployment Checklist

### Funcionalidad Básica

- [ ] `https://neuropredict.app` carga correctamente
- [ ] HTTPS funciona (candado verde en navegador)
- [ ] SSL certificate válido
- [ ] Redirección www → non-www funciona
- [ ] Página principal (`/`) carga sin errores
- [ ] Página About (`/about`) carga sin errores
- [ ] Página Waitlist (`/waitlist`) carga sin errores
- [ ] Página Markets (`/markets`) carga sin errores
- [ ] Detalle de mercado (`/markets/[id]`) carga sin errores

### Formularios y Interacciones

- [ ] Formulario de waitlist funciona:
  - [ ] Validación funciona correctamente
  - [ ] Envío exitoso muestra mensaje de success
  - [ ] Email de notificación llega correctamente
  - [ ] Email de notificación tiene formato correcto
- [ ] Formulario de predicción funciona (si está implementado)
- [ ] Navegación entre páginas fluida
- [ ] Dark mode funciona correctamente

### Analytics & Tracking

#### Google Analytics 4

- [ ] Abre GA4 Dashboard
- [ ] Ve a **Reports → Realtime**
- [ ] Navega en el sitio y verifica pageviews en tiempo real
- [ ] Envía formulario waitlist y verifica evento `waitlist_joined`
- [ ] Espera 24-48h y verifica datos históricos

#### Vercel Analytics

- [ ] Abre Vercel Dashboard → tu proyecto → Analytics
- [ ] Verifica que aparezcan métricas
- [ ] Verifica pageviews
- [ ] Verifica datos de performance (Core Web Vitals)

#### Sentry Error Tracking

- [ ] Abre Sentry Dashboard
- [ ] Verifica que el proyecto esté activo
- [ ] Verifica que no haya errores críticos
- [ ] (Opcional) Fuerza un error de prueba y verifica que aparezca
- [ ] Configura alertas para errores críticos

#### Resend Email

- [ ] Abre Resend Dashboard → Logs
- [ ] Envía un formulario de waitlist
- [ ] Verifica que el email aparezca en logs con status "delivered"
- [ ] Verifica que recibiste el email

### Performance

- [ ] Ve a [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Ingresa `https://neuropredict.app`
- [ ] Verifica scores:
  - [ ] **Performance**: > 90
  - [ ] **Accessibility**: > 90
  - [ ] **Best Practices**: > 90
  - [ ] **SEO**: > 90
- [ ] Si hay warnings, anota para mejorar después

### Cross-Browser Testing

- [ ] **Chrome Desktop**: Todo funciona
- [ ] **Firefox Desktop**: Todo funciona
- [ ] **Safari Desktop**: Todo funciona
- [ ] **Edge Desktop**: Todo funciona
- [ ] **Chrome Mobile**: Todo funciona
- [ ] **Safari iOS**: Todo funciona
- [ ] **Responsive design**: Mobile, Tablet, Desktop

### Social Media Preview

- [ ] Ve a [Open Graph Debugger](https://www.opengraph.xyz/)
- [ ] Ingresa `https://neuropredict.app`
- [ ] Verifica preview:
  - [ ] Título correcto
  - [ ] Descripción correcta
  - [ ] Imagen OG (si existe)
- [ ] Prueba compartir en redes sociales

### SEO & Search Console

- [ ] Envía sitio a [Google Search Console](https://search.google.com/search-console)
- [ ] Verifica que Google pueda indexar el sitio
- [ ] Envía sitemap (si existe)
- [ ] Configura property en Search Console

---

## 🐛 Troubleshooting Quick Guide

### Si Analytics no funciona

1. Verifica variables de entorno en Vercel
2. Confirma `NODE_ENV=production`
3. Revisa Vercel Function Logs
4. Espera 24-48h para datos iniciales
5. Verifica en modo Realtime de GA4

### Si Emails no llegan

1. Verifica `RESEND_API_KEY` en Vercel
2. Verifica `WAITLIST_EMAIL_TO` correcto
3. Revisa Resend Dashboard → Logs
4. Revisa carpeta de Spam
5. Verifica que Resend esté en plan activo

### Si Sentry no captura errores

1. Verifica `NEXT_PUBLIC_SENTRY_DSN`
2. Confirma `enabled: production`
3. Fuerza error de prueba
4. Revisa Sentry Dashboard → Settings
5. Verifica que proyecto no esté disabled

### Si Dominio no resuelve

1. Verifica DNS en [dnschecker.org](https://dnschecker.org)
2. Espera hasta 48h propagación
3. Revisa records A y CNAME
4. Usa Vercel preview URL mientras tanto
5. Verifica dominio en Vercel Dashboard

### Si Build falla

1. Ejecuta `npm run build` localmente
2. Revisa variables de entorno
3. Check Build Logs en Vercel
4. Confirma Root Directory: `./frontend`
5. Verifica todas las dependencies en `package.json`

---

## 📊 Monitoring Post-Launch

### First Week

- [ ] Día 1: Revisar analytics y errores cada 4 horas
- [ ] Día 2-3: Revisar analytics y errores 2 veces al día
- [ ] Día 4-7: Revisar analytics y errores 1 vez al día
- [ ] Responder rápido a waitlist signups

### First Month

- [ ] Semana 1: Revisiones diarias
- [ ] Semana 2-4: Revisiones cada 2-3 días
- [ ] Performance audit semanal
- [ ] Review de user feedback
- [ ] Fix de bugs críticos inmediato

### Ongoing

- [ ] **Monthly**: Performance audits con Lighthouse
- [ ] **Monthly**: Revisión de analytics trends
- [ ] **Monthly**: Actualización de dependencias
- [ ] **Quarterly**: Security audit
- [ ] **Quarterly**: Major feature releases

---

## 🎉 Success Criteria

### Launch es exitoso cuando:

- ✅ Sitio accesible en `https://neuropredict.app`
- ✅ HTTPS y SSL funcionando
- ✅ Todas las páginas cargan sin errores
- ✅ Formularios funcionan correctamente
- ✅ Analytics tracking funcionando
- ✅ Error tracking capturando errores
- ✅ Emails de waitlist llegando
- ✅ Performance scores > 90
- ✅ Responsive design funcional
- ✅ Cross-browser compatible
- ✅ SEO metadata correcta
- ✅ Sin errores críticos en logs

---

## 📝 Notes

Usa este espacio para notas específicas de tu deployment:

```
Fecha de deploy: _______________________
Deploy URL: ___________________________
Notas: ________________________________
______________________________________
______________________________________
```

---

**Última actualización**: Marzo 2026

Para más detalles, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)
