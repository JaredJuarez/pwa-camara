### 🎯 Objetivo de la Práctica

El estudiante implementará una **Progressive Web Application (PWA)** que permite al usuario **acceder a la cámara** de su dispositivo, **tomar una fotografía** y guardar la aplicación para su uso sin conexión.

### 📁 Estructura Inicial de Archivos

Para empezar, asegúrate de que tu proyecto tenga la siguiente estructura de directorios y archivos:

`/pwa-camara
├── index.html  <-- Tu HTML base
├── app.js      <-- Lógica principal de la cámara y botones (¡Siguiente paso!)
├── manifest.json <-- Metadatos de la PWA (¡Lo haremos pronto!)
└── sw.js       <-- Service Worker para caché y offline (¡Lo haremos pronto!)`

---

## 🛠️ Paso 1: Configuración del Archivo `index.html` (Revisión y Entendimiento)

El archivo **`index.html`** que has proporcionado ya contiene la estructura esencial para la aplicación. Este paso consiste en **entender el rol de cada elemento** y asegurar que todos los componentes visuales y funcionales estén listos.

### 1.1. Estructura del HTML

| **Elemento/Etiqueta**                        | **Rol en la PWA**                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `<!DOCTYPE html>`                            | Define el documento como HTML5.                                                      |
| `<meta name="viewport"...>`                  | Esencial para **diseño responsivo**, vital para PWAs.                                |
| `<link rel="manifest" href="manifest.json">` | **Vincula el archivo manifiesto**, necesario para que el navegador "instale" la PWA. |
| `<meta name="theme-color"...>`               | Define el color de la barra de título/navegación del navegador al ejecutar la PWA.   |

### 1.2. Componentes de la Interfaz de Usuario (UI)

| **ID del Elemento** | **Rol en la Aplicación**                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openCamera`        | **Botón** para solicitar permiso al usuario y activar el _streaming_ de la cámara.                                                                        |
| `cameraContainer`   | Contenedor que **muestra u oculta** el _streaming_ de video y el botón para tomar foto. Inicialmente **oculto** (`display: none`).                        |
| `video`             | Elemento **HTML5 Video** donde se renderizará el _streaming_ de video de la cámara. El atributo `autoplay` es crucial para que se inicie automáticamente. |
| `takePhoto`         | **Botón** para capturar el _frame_ actual del elemento `<video>`.                                                                                         |
| `canvas`            | Elemento **HTML5 Canvas** donde se **dibuja el _frame_ capturado**. También se usa para la manipulación y descarga de la imagen. Inicialmente **oculto**. |

### 1.3. Integración de Scripts

- `<script src="app.js"></script>`: Vincula la **lógica principal en JavaScript** que gestionará la cámara, los botones, y la captura de fotos.
- **Registro del Service Worker**:
  - Verifica si el navegador soporta `serviceWorker`.
  - Llama a `navigator.serviceWorker.register('sw.js')` para instalar y activar el Service Worker, que gestionará el caché y las capacidades _offline_.

---

¡Excelente! Este archivo **`app.js`** contiene la lógica central de la PWA. A continuación, presento los pasos detallados para que los estudiantes de ingeniería en desarrollo de software implementen y comprendan cada sección de este script.

---

## ⚙️ Paso 2: Implementación de la Lógica de la Cámara en `app.js`

El archivo `app.js` maneja la interacción con la **Web Media Devices API** (específicamente `getUserMedia`) para acceder al hardware de la cámara y la **Canvas API** para la captura de imágenes.

### 2.1. 🎣 Referencias y Variables Globales

El primer paso es **obtener referencias** a todos los elementos del DOM definidos en `index.html` y configurar variables de estado esenciales.

```jsx
// Referencias a elementos del DOM
const openCameraBtn = document.getElementById("openCamera");
const cameraContainer = document.getElementById("cameraContainer");
const video = document.getElementById("video");
const takePhotoBtn = document.getElementById("takePhoto");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d"); // Contexto 2D para dibujar en el Canvas

let stream = null; // Variable para almacenar el MediaStream de la cámara
```

- **Punto Clave**: El método `canvas.getContext('2d')` inicializa el contexto de dibujo. El `canvas` por sí mismo es solo un contenedor; el `ctx` es el objeto que permite **dibujar** (imágenes, texto, formas) dentro de él.
- **Estado**: La variable `stream` se usará para **mantener una referencia activa** al flujo de video de la cámara, permitiendo luego cerrarlo correctamente.

---

### 2.2. 📹 Función `openCamera()`: Activación de la Cámara

Esta función es **asíncrona** (`async`) porque utiliza `navigator.mediaDevices.getUserMedia()`, que devuelve una **Promesa**.

```jsx
async function openCamera() {
  try {
    // 1. Definición de Restricciones (Constraints)
    const constraints = {
      video: {
        facingMode: { ideal: "environment" }, // Solicita la cámara trasera
        width: { ideal: 320 },
        height: { ideal: 240 },
      },
    };

    // 2. Obtener el Stream de Medios
    stream = await navigator.mediaDevices.getUserMedia(constraints);

    // 3. Asignar el Stream al Elemento <video>
    video.srcObject = stream;

    // 4. Actualización de la UI
    cameraContainer.style.display = "block";
    openCameraBtn.textContent = "Cámara Abierta";
    openCameraBtn.disabled = true;

    console.log("Cámara abierta exitosamente");
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
  }
}
```

- **`constraints`**: Objeto crucial que le indica al navegador qué tipo de medio queremos (solo `video`) y con qué preferencias (`facingMode: 'environment'` para la cámara trasera).
- **`getUserMedia()`**: Esta llamada **solicita permiso** al usuario. Si se concede, el resultado (`stream`) es un **`MediaStream`** que contiene el flujo de video.
- **`video.srcObject`**: Propiedad utilizada para **conectar** el `MediaStream` directamente al elemento `<video>`, iniciando la reproducción del _streaming_.

---

### 2.3. 📸 Función `takePhoto()`: Captura y Procesamiento

Esta función toma el _frame_ actual del video y lo convierte en datos de imagen.

```jsx
function takePhoto() {
  if (!stream) {
    alert("Primero debes abrir la cámara");
    return;
  }

  // 1. Dibujar el Frame de Video en el Canvas
  // El método drawImage() es clave: toma el <video> como fuente.
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Conversión a Data URL
  const imageDataURL = canvas.toDataURL("image/png");

  // 3. (Opcional) Visualización y Depuración
  console.log("Foto capturada en base64:", imageDataURL.length, "caracteres");

  // 4. Cierre de la Cámara (Para liberar recursos)
  closeCamera();
}
```

- **`ctx.drawImage(video, ...)`**: Esta es la operación de captura. El contenido (el _frame_ actual) del elemento **`<video>`** se **dibuja** sobre el contexto 2D del **`<canvas>`**.
- **`canvas.toDataURL('image/png')`**: Transforma el contenido del `canvas` en una **cadena Base64** que representa la imagen. Este es un formato común para incrustar datos de imagen directamente en documentos HTML o transferirlos.

---

### 2.4. 🛑 Función `closeCamera()`: Liberación de Recursos

Es esencial **cerrar la cámara** después de su uso para liberar los recursos del dispositivo y evitar el consumo innecesario de batería.

```jsx
function closeCamera() {
  if (stream) {
    // Detener todos los tracks del stream (video, audio, etc.)
    stream.getTracks().forEach((track) => track.stop());
    stream = null; // Limpiar la referencia

    // Limpiar y ocultar UI
    video.srcObject = null;
    cameraContainer.style.display = "none";

    // Restaurar el botón 'Abrir Cámara'
    openCameraBtn.textContent = "Abrir Cámara";
    openCameraBtn.disabled = false;

    console.log("Cámara cerrada");
  }
}
```

- **`stream.getTracks().forEach(track => track.stop())`**: La forma canónica de **detener** el flujo de medios. Se itera sobre todos los _tracks_ (p. ej., el _track_ de video) y se llama a `stop()`.

---

### 2.5. 🖱️ Event Listeners y Limpieza

Finalmente, se asignan las funciones a los eventos de los botones y se añade una limpieza al cerrar la página.

```jsx
// Event listeners para la interacción del usuario
openCameraBtn.addEventListener("click", openCamera);
takePhotoBtn.addEventListener("click", takePhoto);

// Limpiar stream cuando el usuario cierra o navega fuera de la página
window.addEventListener("beforeunload", () => {
  closeCamera();
});
```

- **`beforeunload`**: Asegura que la cámara se cierre (liberando recursos) incluso si el usuario simplemente cierra la pestaña o navega a otra URL.

---

---

## ☁️ Paso 3: Creación del Service Worker (`sw.js`) para Capacidad _Offline_

El Service Worker actúa como un **proxy** programable entre la aplicación y la red. Su principal función aquí es implementar una estrategia de **"Cache First"** (Primero el Caché).

### 3.1. ⚙️ Variables de Configuración Inicial

Se definen las constantes necesarias para gestionar el caché.

```jsx
// Service Worker para PWA
const CACHE_NAME = "camara-pwa-v1"; // Nombre/versión del caché
const urlsToCache = [
  // Lista de archivos a guardar en caché
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
];
```

- **`CACHE_NAME`**: Es esencial usar un nombre versionado (ej: `v1`). Si más adelante actualizas la aplicación (y los archivos en caché), solo tienes que cambiar este nombre a `v2`.
- **`urlsToCache`**: Esta lista incluye todos los **recursos estáticos** mínimos que la PWA necesita para cargarse y funcionar la primera vez, asegurando la capacidad _offline_.

---

### 3.2. 📥 Evento `install`: Almacenamiento Inicial

El evento `install` se dispara la **primera vez** que el Service Worker se registra y es el lugar ideal para precachear recursos.

```jsx
// Instalar Service Worker
self.addEventListener("install", function (event) {
  // 1. Usar event.waitUntil para asegurar que la instalación no termine hasta que el caché esté listo
  event.waitUntil(
    // 2. Abrir el caché con el nombre definido
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Cache abierto");
      // 3. Agregar todos los archivos de urlsToCache al almacenamiento
      return cache.addAll(urlsToCache);
    })
  );
});
```

- **`event.waitUntil()`**: Le indica al navegador que **no debe considerar que el Service Worker está instalado** hasta que la Promesa dentro se resuelva.
- **`caches.open(CACHE_NAME)`**: Accede al área de almacenamiento de caché del navegador.
- **`cache.addAll(urlsToCache)`**: Descarga todos los archivos listados y los guarda en el caché **de forma atómica** (si uno falla, todos fallan).

---

### 3.3. 🌐 Evento `fetch`: Estrategia Cache First

El evento `fetch` intercepta **todas las solicitudes de red** hechas por la aplicación, permitiendo al Service Worker decidir si usar la red o el caché.

```jsx
// Interceptar peticiones
self.addEventListener("fetch", function (event) {
  // Usar event.respondWith para controlar la respuesta
  event.respondWith(
    // 1. Intentar encontrar la solicitud en el caché
    caches.match(event.request).then(function (response) {
      // 2. Si se encuentra una respuesta en caché (es decir, el archivo existe)
      if (response) {
        return response; // Devolver la versión en caché
      }
      // 3. Si no está en caché, ir a la red
      return fetch(event.request);
    })
  );
});
```

- **Estrategia implementada**: **Cache First, then Network** (Primero caché, luego red).
  1. Intenta obtener el recurso de `caches.match()`.
  2. Si lo encuentra (`if (response)`), lo devuelve inmediatamente (¡rápido y _offline_!).
  3. Si no lo encuentra, lo pide a la red (`fetch(event.request)`).

---

### 3.4. ♻️ Evento `activate`: Limpieza de Cachés Antiguos

El evento `activate` ocurre después de que un nuevo Service Worker ha sido instalado y toma el control de la página. Se usa principalmente para la **migración y limpieza** de cachés obsoletos.

```jsx
// Activar Service Worker
self.addEventListener("activate", function (event) {
  event.waitUntil(
    // 1. Obtener todos los nombres de caché existentes
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        // 2. Mapear y filtrar los cachés que no coinciden con el nombre actual (CACHE_NAME)
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            // 3. Eliminar los cachés obsoletos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

- **Propósito**: Asegura que si se despliega una nueva versión del Service Worker (con un nuevo `CACHE_NAME`, ej: `v2`), los recursos de la versión anterior (`v1`) se eliminen, evitando que la aplicación utilice archivos desactualizados o consuma espacio innecesario.

---

---

## 📱 Paso 4: Creación del Manifiesto de Aplicación (`manifest.json`)

El **Web App Manifest** es un archivo JSON que proporciona al navegador información sobre tu aplicación web, incluyendo metadatos de cómo debe aparecer si se instala en un dispositivo.

### 4.1. 📝 Propiedades de Identificación y Presentación

Estas propiedades definen la identidad de la PWA y cómo se muestra en la pantalla de inicio o en la lista de aplicaciones.

| **Propiedad**   | **Valor Ejemplo**                | **Descripción y Función**                                                                                                                               |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"name"`        | `"Cámara PWA"`                   | El **nombre completo** de la aplicación, usado en _banners_ de instalación y en la pantalla de bienvenida.                                              |
| `"short_name"`  | `"CamaraPWA"`                    | Un nombre **más corto** (generalmente **12 caracteres o menos**), ideal para el icono debajo de la aplicación en la pantalla de inicio del dispositivo. |
| `"description"` | `"Aplicación web progresiva..."` | Una breve descripción utilizada en tiendas de aplicaciones o en diálogos de instalación.                                                                |
| `"start_url"`   | `"/"`                            | La **URL que se carga** cuando el usuario abre la aplicación desde su icono. Usar `"/"` asegura que se cargue la página principal (`index.html`).       |

### 4.2. 🎨 Propiedades de Interfaz y Apariencia

Estas definen la experiencia visual cuando la PWA se ejecuta como una aplicación nativa.

| **Propiedad**        | **Valor Ejemplo** | **Descripción y Función**                                                                                                                                                                            |
| -------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"display"`          | `"standalone"`    | **Modo de visualización clave.** Al usar `standalone`, la aplicación se abre en una ventana propia, ocultando la barra de direcciones del navegador, haciendo que parezca una **aplicación nativa**. |
| `"background_color"` | `"#ffffff"`       | El color de fondo que se muestra brevemente durante la **pantalla de bienvenida** (splash screen) mientras la aplicación carga.                                                                      |
| `"theme_color"`      | `"#000000"`       | El color utilizado por el sistema operativo para elementos de la interfaz, como la barra de estado del teléfono. **Debe coincidir** con la etiqueta `<meta name="theme-color">` en tu `index.html`.  |
| `"orientation"`      | `"portrait"`      | Define la orientación preferida de la aplicación. `portrait` (vertical) es común para utilidades de cámara o sociales.                                                                               |

### 4.3. 🖼️ Configuración de Iconos (`icons`)

Esta matriz de objetos es esencial para la **instalación**. El navegador necesita múltiples tamaños de iconos para adaptarse a diferentes resoluciones de dispositivos.

```json
"icons": [
    {
        "src": "icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
]
```

- **Implementación requerida**: El estudiante debe asegurarse de que los archivos `icon-192.png` y `icon-512.png` existan en la **raíz del proyecto**.

---

---

## 🔄 Paso 5: Mejoras de Experiencia de Usuario (UX)

### 5.1. 📐 Visualización Completa de la Cámara

Para mejorar la experiencia en dispositivos móviles, se implementaron cambios en el CSS para que el video de la cámara se visualice completamente:

**Cambios en el CSS del elemento `<video>`:**

```css
video {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-bottom: 12px;
  background: #000;
  display: block;
  aspect-ratio: auto;
}
```

**Modificación del contenedor:**

```css
.container {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 90vw; /* Cambio de 400px a 90vw para aprovechar el ancho completo */
  width: 100%;
}
```

- **`aspect-ratio: auto`**: Permite que el video mantenga su relación de aspecto original
- **`height: auto`**: El alto se ajusta automáticamente según el ancho
- **`max-width: 90vw`**: Utiliza el 90% del ancho de la ventana (viewport width)

### 5.2. 🖼️ Sistema de Galería de Fotos con Scroll Horizontal

Se implementó un sistema de galería de fotos que permite:

- Visualizar fotos tomadas durante la sesión actual
- Mostrar miniaturas en un carrusel deslizable
- Descargar fotos individuales al hacer clic
- Eliminar fotos individuales o todas a la vez

**Nota importante**: Las fotos se almacenan **temporalmente en memoria** durante la sesión actual. Al cerrar o recargar la página, las fotos se eliminan automáticamente.

#### Estructura HTML de la Galería

```html
<!-- Galería de fotos en la parte inferior -->
<div id="photoGallery">
  <div class="gallery-header">
    <span class="gallery-title"
      >Mis Fotos (<span id="photoCount">0</span>)</span
    >
    <button class="clear-all-btn" id="clearAllBtn">Eliminar Todas</button>
  </div>
  <div class="gallery-container" id="galleryContainer"></div>
</div>
```

#### Estilos CSS para la Galería

```css
/* Galería de fotos en la parte inferior */
#photoGallery {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  z-index: 1000;
  display: none;
}

#photoGallery.active {
  display: block;
}

.gallery-container {
  display: inline-flex;
  gap: 10px;
  padding: 5px;
}

.photo-item {
  position: relative;
  display: inline-block;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item img {
  height: 100%;
  width: auto;
  display: block;
}

.photo-item .delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  cursor: pointer;
}
```

#### Funcionalidades JavaScript para la Galería

**1. Variables y Referencias del DOM:**

```javascript
const photoGallery = document.getElementById("photoGallery");
const galleryContainer = document.getElementById("galleryContainer");
const photoCount = document.getElementById("photoCount");
const clearAllBtn = document.getElementById("clearAllBtn");

let photos = []; // Array para almacenar las fotos temporalmente (solo en sesión actual)
```

**Nota**: El array `photos` solo existe en memoria durante la sesión actual. No se utiliza `localStorage` para persistencia.

```javascript
// Renderizar la galería de fotos
function renderGallery() {
  galleryContainer.innerHTML = "";

  if (photos.length === 0) {
    photoGallery.classList.remove("active");
    return;
  }

  photoGallery.classList.add("active");
  photoCount.textContent = photos.length;

  photos.forEach((photo, index) => {
    const photoItem = document.createElement("div");
    photoItem.className = "photo-item";

    const img = document.createElement("img");
    img.src = photo.dataURL;
    img.alt = `Foto ${index + 1}`;
    img.onclick = () => downloadPhoto(photo.dataURL, photo.timestamp);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "×";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deletePhoto(index);
    };

    photoItem.appendChild(img);
    photoItem.appendChild(deleteBtn);
    galleryContainer.appendChild(photoItem);
  });
}
```

- **Creación dinámica de elementos**: Cada foto se crea como un elemento HTML
- **Event listeners inline**: Click en la imagen para descargar, botón × para eliminar
- **`e.stopPropagation()`**: Evita que el click del botón eliminar active el click de la imagen

**3. Gestión de Fotos:**

```javascript
// Agregar una nueva foto a la galería
function addPhotoToGallery(dataURL) {
  const photo = {
    dataURL: dataURL,
    timestamp: Date.now(),
  };

  photos.push(photo);
  renderGallery();
}

// Eliminar una foto específica
function deletePhoto(index) {
  if (confirm("¿Eliminar esta foto?")) {
    photos.splice(index, 1);
    renderGallery();
  }
}

// Eliminar todas las fotos
function clearAllPhotos() {
  if (photos.length === 0) return;

  if (confirm(`¿Eliminar todas las ${photos.length} fotos?`)) {
    photos = [];
    renderGallery();
  }
}

// Descargar una foto
function downloadPhoto(dataURL, timestamp) {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = `foto-${timestamp}.png`;
  link.click();
}
```

- **Estructura de datos**: Cada foto incluye `dataURL` (imagen en base64) y `timestamp` (marca de tiempo)
- **Confirmaciones**: Se pide confirmación antes de eliminar fotos
- **Descarga programática**: Se crea un enlace temporal para descargar la imagen
- **Sin persistencia**: Las fotos solo existen en memoria durante la sesión actual

**4. Modificación de la Función `takePhoto()`:**

```javascript
function takePhoto() {
  if (!stream) {
    alert("Primero debes abrir la cámara");
    return;
  }

  // 1. Dibujar el Frame de Video en el Canvas con las dimensiones reales
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Conversión a Data URL
  const imageDataURL = canvas.toDataURL("image/png");

  // 3. Agregar la foto a la galería
  addPhotoToGallery(imageDataURL);

  // 4. Mostrar el canvas con la foto capturada brevemente
  canvas.style.display = "block";
  setTimeout(() => {
    canvas.style.display = "none";
  }, 1000);

  // Nota: Ya NO cerramos la cámara automáticamente para permitir tomar múltiples fotos
  console.log("Foto agregada a la galería");
}
```

**Cambios principales:**

- **No cierra la cámara**: Permite tomar múltiples fotos consecutivas
- **Feedback visual**: Muestra el canvas por 1 segundo como confirmación
- **Almacenamiento temporal**: Agrega la foto a la galería en memoria (no localStorage)

**5. Event Listeners Actualizados:**

```javascript
// Event listeners para la interacción del usuario
openCameraBtn.addEventListener("click", openCamera);
takePhotoBtn.addEventListener("click", takePhoto);
switchCameraBtn.addEventListener("click", switchCamera);
clearAllBtn.addEventListener("click", clearAllPhotos);

// Verificar si es móvil al cargar
window.addEventListener("load", () => {
  checkIfMobile();
});
```

### 5.3. 📱 Mejoras para Dispositivos Móviles

**Ajuste del padding del body:**

```css
body {
  padding: 20px;
  padding-bottom: 140px; /* Espacio para la galería */
}

@media (max-width: 768px) {
  body {
    padding: 10px;
    padding-bottom: 140px;
  }
}
```

- **`padding-bottom`**: Evita que el contenido quede oculto detrás de la galería fija

### 5.4. 🎨 Características de UX Implementadas

| **Característica**         | **Descripción**                       | **Beneficio**                       |
| -------------------------- | ------------------------------------- | ----------------------------------- |
| **Galería temporal**       | Almacena fotos solo durante la sesión | Simplifica la gestión de memoria    |
| **Scroll horizontal**      | `overflow-x: auto` en la galería      | Permite ver muchas fotos deslizando |
| **Contador de fotos**      | Muestra el número total de fotos      | Información visual del estado       |
| **Eliminación individual** | Botón × en cada foto                  | Control granular sobre las fotos    |
| **Eliminación masiva**     | Botón "Eliminar Todas"                | Limpieza rápida de la galería       |
| **Descarga al click**      | Click en foto para descargar          | Acceso rápido a las fotos           |
| **Feedback visual**        | Canvas se muestra 1 segundo           | Confirmación de captura             |
| **Cámara persistente**     | No se cierra tras tomar foto          | Permite múltiples capturas rápidas  |
| **Efecto hover**           | Escala de miniaturas al pasar mouse   | Mejora la interactividad            |
| **Backdrop blur**          | Efecto de desenfoque en galería       | Estética moderna                    |

### 5.5. 📊 Flujo de Trabajo Actualizado

1. Usuario abre la cámara
2. Usuario toma una o varias fotos
3. Cada foto se guarda automáticamente en la galería (en memoria)
4. La galería aparece automáticamente en la parte inferior
5. Usuario puede:
   - Deslizar para ver todas las fotos
   - Hacer click en una foto para descargarla
   - Eliminar fotos individuales con el botón ×
   - Eliminar todas las fotos con "Eliminar Todas"
6. Al cerrar o recargar la página, todas las fotos se eliminan automáticamente

---

## 📝 Resumen de Cambios Técnicos

### Archivos Modificados:

1. **`index.html`**:

   - Ajuste del contenedor para aprovechar el ancho completo (90vw)
   - Nuevo elemento `<div id="photoGallery">` para la galería
   - CSS para galería con scroll horizontal y efectos visuales
   - Padding inferior en body para espacio de galería

2. **`app.js`**:
   - Nuevas referencias al DOM para galería
   - Variable `photos[]` para almacenar fotos temporalmente
   - Función `renderGallery()` para mostrar fotos
   - Funciones de gestión: `addPhotoToGallery()`, `deletePhoto()`, `clearAllPhotos()`, `downloadPhoto()`
   - Modificación de `takePhoto()` para no cerrar cámara
   - **Sin uso de localStorage**: Las fotos solo existen en memoria

### Nuevas Dependencias:

- **Dynamic DOM Manipulation**: Creación dinámica de elementos de galería
- **Event Delegation**: Gestión de eventos en elementos dinámicos

### Consideraciones de Rendimiento:

- Las fotos se almacenan **temporalmente en memoria** como base64
- Al cerrar o recargar la página, las fotos se eliminan automáticamente
- No hay límites de `localStorage` ya que no se usa persistencia
- Ideal para sesiones de uso temporal sin necesidad de almacenamiento a largo plazo
