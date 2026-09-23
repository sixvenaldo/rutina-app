# Rutina

Checklist diario para Android: tareas diarias, de ciertos días de la semana o de una fecha, con historial de lo que hiciste y lo que no. Fondo negro por defecto y colores ajustables.

## Instalar

- **APK:** descarga el último `.apk` desde [Releases](../../releases/latest) en tu celular y ábrelo. Android pedirá permiso para instalar apps de origen desconocido.
- **Web (PWA):** abre la página de GitHub Pages del repositorio en Chrome → menú ⋮ → *Instalar app*.

Tus tareas se guardan solo en el teléfono. Usa **Ajustes → Exportar** para hacer copias de seguridad.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `app.html` | Toda la app: interfaz, estilos y lógica |
| `build.js` | Genera `www/` (index, manifest, service worker, íconos) y los íconos de Android |
| `capacitor.config.json` | Configuración de Capacitor (empaqueta la web como app Android) |
| `android/` | Proyecto Android generado por Capacitor |
| `.github/workflows/build.yml` | Compila y firma el APK y publica la versión web en cada push a `main` |

## Desarrollo

```bash
npm install
node build.js              # genera www/
npx cap sync android       # copia www/ al proyecto Android
```

Cada `git push` a `main` compila un APK nuevo en GitHub Actions y lo publica en Releases.

### Firma del APK

El workflow firma con la llave guardada en los secretos del repositorio `KEYSTORE_BASE64` y `KEYSTORE_PASSWORD` (alias `rutina`). La llave **no** está en el repositorio. Si se pierde, las actualizaciones ya no se podrán instalar encima de la app existente.
