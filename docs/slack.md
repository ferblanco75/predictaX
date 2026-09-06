# Slack — NeuroPredict

Documentación del workspace de Slack del equipo y de las integraciones que cuelgan de él.

> Estado: workspace creado. Canales e integraciones en curso. Ver #235 y #236.

## Workspace

| Dato | Valor |
|---|---|
| URL | `https://neuropredict.slack.com` |
| Nombre | NeuroPredict |
| Cuenta de administración | `neuropredict.io@gmail.com` (cuenta genérica del proyecto, no personal) |
| Plan | Free |

### Sobre la cuenta de administración

`neuropredict.io@gmail.com` es **dueña del workspace**. Quien controla esa casilla controla Slack entero,
incluidas las apps instaladas y sus tokens. Requisitos mínimos:

- 2FA activo en la cuenta de Google
- Contraseña en el gestor de contraseñas del equipo, nunca en un archivo ni en un chat
- Método de recuperación que no dependa de un solo teléfono personal (códigos de respaldo guardados)
- Al menos **2 Workspace Owners** en Slack, para no quedar bloqueados si se pierde acceso al Gmail

Esta misma cuenta conviene que sea dueña del resto de las propiedades de Google del proyecto
(Search Console, Analytics), para que no queden repartidas en cuentas personales.

A futuro se evaluará migrar a `admin@neuropredict.io` cuando exista email del dominio propio — ver #65.

## Límites del plan Free

| Límite | Valor | Consecuencia |
|---|---|---|
| Historial de mensajes | 90 días | Lo que caiga en `#alertas` se pierde pasados los 90 días. Si hace falta retención, exportar o mandar las alertas a otro destino |
| Integraciones / apps | 10 | Alcanza para el agente + alertas + CI/CD, pero hay que llevar la cuenta |

## Canales

| Canal | Propósito | Estado |
|---|---|---|
| `#general` | Anuncios del equipo | Pendiente |
| `#dev` | Desarrollo frontend/backend | Pendiente |
| `#infra` | Docker, CI/CD, deploys | Pendiente |
| `#alertas` | Alertas de Prometheus/Alertmanager (#45) | Pendiente |
| `#ci-cd` | Notificaciones de GitHub Actions | Pendiente |
| `#agente` | Bot del agente de NeuroPredict (#236) | Pendiente |

## Integraciones previstas

### 1. Agente de NeuroPredict (#236)

Agente interno del equipo, invocable desde Slack.

- **Dónde corre:** en infraestructura **separada de este repo**. No es un servicio de `docker-compose.yml`
  ni se despliega en Render/Vercel.
- **Framework:** OpenClaw o Hermes Agent — a definir.
- **Modelo:** Gemini u OpenAI — a definir. Usa API key propia, no la del producto, para no consumir la
  quota de la app ni ensuciar el tracking de `ai_usage_log`.
- **Modo de conexión:** Socket Mode. La conexión la abre el agente *hacia* Slack, saliente, así que ninguna
  de las dos infraestructuras necesita URL pública ni puertos abiertos.
- **Scopes mínimos:** `app_mentions:read`, `chat:write`, `channels:history`, `im:history`, `im:write`,
  `groups:history`
- **Eventos:** `app_mention`, `message.im`

No confundir con la épica #228, que es el chatbot de la plataforma para usuarios finales en la web.

### 2. Alertmanager → `#alertas` (#45)

La configuración ya está preparada pero comentada en `infra/alertmanager/alertmanager.yml:27`, esperando
el webhook del workspace.

### 3. GitHub Actions → `#ci-cd`

Pendiente de definir.

## Reglas de manejo de credenciales

- Los tokens de Slack (`SLACK_BOT_TOKEN` con prefijo `xoxb-`, `SLACK_APP_TOKEN` con prefijo `xapp-`)
  **nunca** se guardan en este repositorio: ni en `.env`, ni en `.env.example`, ni en documentación.
- Viven en el entorno de la infraestructura donde corre el agente.
- El traspaso de tokens se hace por canal seguro — no por Slack, no por mail, no por el repo.
- La instalación de apps en el workspace queda restringida a admins.
- El bot se invita solo a los canales donde debe estar, no a todos.
- Debe existir un procedimiento documentado de rotación de tokens.

## Issues relacionados

| Issue | Tema |
|---|---|
| #235 | Alta del workspace de Slack |
| #236 | Slack App + conexión del agente |
| #45 | Alertmanager / observabilidad |
| #65 | Dominio propio (para email de administración) |
| #72 | GDPR — aplica si el agente accede a datos de producción |
| #228 | Chatbot de la plataforma (distinto de este agente) |
