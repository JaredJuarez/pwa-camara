// Referencias a elementos del DOM
const openCameraBtn = document.getElementById("openCamera");
const cameraContainer = document.getElementById("cameraContainer");
const video = document.getElementById("video");
const takePhotoBtn = document.getElementById("takePhoto");
const switchCameraBtn = document.getElementById("switchCamera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d"); // Contexto 2D para dibujar en el Canvas
const photoGallery = document.getElementById("photoGallery");
const galleryContainer = document.getElementById("galleryContainer");
const photoCount = document.getElementById("photoCount");

let stream = null; // Variable para almacenar el MediaStream de la cámara
let currentFacingMode = "user"; // Iniciar con cámara frontal (selfie)
let isMobile = false;
let photos = []; // Array para almacenar las fotos temporalmente (solo en sesión actual)

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

// Descargar una foto
function downloadPhoto(dataURL, timestamp) {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = `foto-${timestamp}.png`;
  link.click();
}

// Detectar si es dispositivo móvil
function checkIfMobile() {
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;

  // Mostrar u ocultar el botón de cambiar cámara
  if (isMobile) {
    switchCameraBtn.style.display = "block";
  }

  return isMobile;
}

// Función para obtener las dimensiones óptimas del video
async function getOptimalVideoSize() {
  if (isMobile) {
    // Para móviles, usar dimensiones mayores
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  } else {
    // Para escritorio, dimensiones moderadas
    return {
      width: { ideal: 640 },
      height: { ideal: 480 },
    };
  }
}

// Función para abrir la cámara
async function openCamera() {
  try {
    checkIfMobile();

    // 1. Definición de Restricciones (Constraints)
    const videoSize = await getOptimalVideoSize();
    const constraints = {
      video: {
        facingMode: currentFacingMode, // user = frontal, environment = trasera
        ...videoSize,
      },
    };

    // 2. Obtener el Stream de Medios
    stream = await navigator.mediaDevices.getUserMedia(constraints);

    // 3. Asignar el Stream al Elemento <video>
    video.srcObject = stream;

    // Esperar a que el video esté listo para obtener sus dimensiones reales
    video.addEventListener("loadedmetadata", () => {
      // Ajustar el canvas al tamaño real del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log(`Canvas ajustado a: ${canvas.width}x${canvas.height}`);
    });

    // 4. Actualización de la UI
    cameraContainer.style.display = "block";
    openCameraBtn.style.display = "none";

    console.log(`Cámara abierta exitosamente - Modo: ${currentFacingMode}`);
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
  }
}

// Función para cambiar entre cámara frontal y trasera
async function switchCamera() {
  if (!stream) return;

  // Cerrar el stream actual
  stream.getTracks().forEach((track) => track.stop());

  // Cambiar el modo de cámara
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";

  // Abrir la cámara con el nuevo modo
  try {
    const videoSize = await getOptimalVideoSize();
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        ...videoSize,
      },
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Actualizar dimensiones del canvas
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`Canvas ajustado a: ${canvas.width}x${canvas.height}`);
    });

    console.log(`Cámara cambiada a: ${currentFacingMode}`);
  } catch (error) {
    console.error("Error al cambiar de cámara:", error);
    alert("No se pudo cambiar de cámara.");
  }
}

// Función para tomar una foto
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

  // 3. (Opcional) Visualización y Depuración
  console.log(
    `Foto capturada: ${canvas.width}x${canvas.height}, ${imageDataURL.length} caracteres`
  );

  // 4. Agregar la foto a la galería
  addPhotoToGallery(imageDataURL);

  // Nota: Ya NO cerramos la cámara automáticamente para permitir tomar múltiples fotos
  console.log("Foto agregada a la galería");
}

// Función para cerrar la cámara
function closeCamera() {
  if (stream) {
    // Detener todos los tracks del stream (video, audio, etc.)
    stream.getTracks().forEach((track) => track.stop());
    stream = null; // Limpiar la referencia

    // Limpiar y ocultar UI
    video.srcObject = null;
    cameraContainer.style.display = "none";

    // Restaurar el botón 'Abrir Cámara'
    openCameraBtn.style.display = "block";

    console.log("Cámara cerrada");
  }
}

// Event listeners para la interacción del usuario
openCameraBtn.addEventListener("click", openCamera);
takePhotoBtn.addEventListener("click", takePhoto);
switchCameraBtn.addEventListener("click", switchCamera);

// Limpiar stream cuando el usuario cierra o navega fuera de la página
window.addEventListener("beforeunload", () => {
  closeCamera();
});

// Verificar si es móvil al cargar
window.addEventListener("load", () => {
  checkIfMobile();
});
