# RRHH_WEB

App de gestión de RR.HH. para las empresas del grupo. Consume la API `/api/v2/rrhh` de `SIS_RRHH`.

React 19 · Vite · TailwindCSS 4 · React Router 7 · Axios · TanStack Query.

## Arrancar

```bash
# 1. API (en SIS_RRHH)
php artisan serve              # http://127.0.0.1:8000

# 2. Esta app
cp .env.example .env           # VITE_API_URL apunta a la API
npm install
npm run dev                    # http://localhost:5174
```

Se entra con el usuario y la clave de la intranet. El usuario necesita rol de RR.HH. (`USUARIOS_INTRANET.rol_rrhh`); ver `SIS_RRHH/database/sp/README.md`.

## Estructura

```
src/
├── api/
│   ├── client.js            axios + token + manejo de 401 + mensajes de error
│   └── endpoints/           un archivo por módulo (auth.js, inicio.js…)
├── app/
│   ├── router.jsx           rutas protegidas
│   ├── providers.jsx        TanStack Query, sesión y ámbito de empresas
│   ├── modulos.js           mapa de módulos (menú lateral y tarjetas de inicio)
│   └── layout/AppLayout.jsx encabezado fijo (selector de empresas), menú fijo contraíble
├── context/
│   ├── AuthContext.jsx      usuario, permisos, login y logout
│   └── EmpresaContext.jsx   empresas elegidas (vacío = todas), persistido
├── components/              compartidos: Modal (dialog nativo), ui.jsx (Indicador, Segmentado,
│                            Paginacion, Aviso, Campo, Dato…), Icon
├── features/<modulo>/       pages/, hooks/ (consultas) y components/ de cada módulo
└── lib/format.js            nombres de empresa, números
```

## Pantallas construidas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio: indicadores por empresa y pendientes |
| `/contratos?situacion=` | Contratos: tarjetas, pestañas por situación, lista y detalle con renovar, editar, anular, cese y nuevo contrato |
| `/evaluaciones?estado=` | Evaluaciones: tarjetas, pestañas por estado y lista |
| `/evaluaciones/:empresa/:codPersonal?periodo=AAAAMM` | Ficha de evaluación: criterios RR.HH. y jefe, recomendación, jefe y aprobadores, aprobación y renovación |

Los filtros viven en la URL, así un enlace (por ejemplo desde Inicio) abre la lista ya filtrada.

## Reglas

- **Ámbito de empresas global.** Toda consulta de listado o resumen envía `?empresas=` con lo elegido en el selector de empresas del encabezado (`empresasParam`) e incluye `seleccionadas` en su `queryKey`.
- **En pantalla va el nombre de la empresa**, nunca el código de conexión (`BDV0004`). El código solo viaja a la API.
- **Un módulo = una carpeta en `features/`** y un archivo en `api/endpoints/`. Para darlo de alta en el menú se edita `app/modulos.js` y se agrega su ruta en `app/router.jsx`.
- Un indicador `null` significa que la empresa no tiene ese módulo; se muestra «—».
- Estilos: clases de componente en `src/index.css` (`glass`, `btn`, `chip`, `tile`, `badge`…). Base blanca; el rojo de la clínica solo como acento.
