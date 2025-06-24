// Importa las funciones necesarias de Firebase
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBspx-Hnnb-y-xXTr-z5lJj0_XEYppo2QM",
  authDomain: "modareyes-59991.firebaseapp.com",
  projectId: "modareyes-59991",
  storageBucket: "modareyes-59991.firebasestorage.app",
  messagingSenderId: "49086566305",
  appId: "1:49086566305:web:44a0a1cb688c25f1f385e0",
  measurementId: "G-CSN0MT6CXZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const imagenPrincipal = document.getElementById('imagen-principal');
const nombreEl = document.getElementById('nombre');
const categoriaEl = document.getElementById('categoria');
const precioEl = document.getElementById('precio');
const tallasEl = document.getElementById('tallas');
const stockEl = document.getElementById('stock');
const descripcionEl = document.getElementById('descripcion');
const agregarCarritoBtn = document.getElementById('agregar-carrito');

const flechaIzquierda = document.querySelector('.flecha.izquierda');
const flechaDerecha = document.querySelector('.flecha.derecha');

const selectTalla = document.getElementById('select-talla');
const inputCantidad = document.getElementById('input-cantidad');

let imagenes = [];
let indiceImagen = 0;
let stockActual = 0;
let videoActual = null;
let producto = null; // <-- la variable ahora es global

const params = new URLSearchParams(window.location.search);
const productoId = params.get('id');

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

async function cargarProducto(id) {
  if (!id) {
    alert("No se especificó el producto.");
    window.location.href = "productos.html";
    return;
  }

  const docRef = doc(db, "productos", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    alert("Producto no encontrado.");
    window.location.href = "productos.html";
    return;
  }

  producto = docSnap.data(); // asignamos a la variable global

  nombreEl.textContent = producto.nombre || "";
  categoriaEl.textContent = producto.categoria || "";
  precioEl.textContent = producto.precio || "";
  descripcionEl.textContent = producto.descripcion || "";

  const tallasArray = Array.isArray(producto.tallas) ? producto.tallas : [];
  tallasEl.textContent = tallasArray.length > 0 ? tallasArray.join(', ') : "No disponible";

  stockActual = producto.stock || 0;
  stockEl.textContent = stockActual;

  if (stockActual <= 0) {
    stockEl.textContent = "Agotado";
    stockEl.classList.add('stock-agotado');
    agregarCarritoBtn.disabled = true;
  } else {
    stockEl.classList.remove('stock-agotado');
    agregarCarritoBtn.disabled = false;
  }

  imagenes = producto.imagenes || [];
  if (imagenes.length === 0 && producto.imagen) {
    imagenes = [producto.imagen];
  }

  if (imagenes.length > 0) {
    indiceImagen = 0;
    mostrarImagen(indiceImagen);
  } else {
    imagenPrincipal.innerHTML = "<p>No hay imágenes disponibles</p>";
  }

  selectTalla.innerHTML = '';
  tallasArray.forEach(talla => {
    const option = document.createElement('option');
    option.value = talla;
    option.textContent = talla;
    selectTalla.appendChild(option);
  });

  if (tallasArray.length === 0) {
    selectTalla.disabled = true;
    agregarCarritoBtn.disabled = true;
  } else {
    selectTalla.disabled = false;
  }
}

function mostrarImagen(indice) {
  if (imagenes.length === 0) return;

  // Asegurar que el índice esté dentro del rango
  if (indice < 0) {
    indiceImagen = imagenes.length - 1;
  } else if (indice >= imagenes.length) {
    indiceImagen = 0;
  } else {
    indiceImagen = indice;
  }

  // Detener cualquier video anterior
  if (videoActual && !videoActual.paused) {
    videoActual.pause();
    videoActual.currentTime = 0;
  }

  const url = imagenes[indiceImagen];
  const esVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');

  if (esVideo) {
    imagenPrincipal.innerHTML = `
      <video id="video-secundario" autoplay muted playsinline controls width="100%" height="auto">
        <source src="${url}" type="video/mp4">
        Tu navegador no soporta la reproducción de video.
      </video>
    `;
    videoActual = document.getElementById('video-secundario');
  } else {
    imagenPrincipal.innerHTML = `<img src="${url}" alt="Imagen del producto" style="width: 100%;">`;
    videoActual = null;
  }
}

flechaIzquierda.addEventListener('click', () => {
  mostrarImagen(indiceImagen - 1);
});

flechaDerecha.addEventListener('click', () => {
  mostrarImagen(indiceImagen + 1);
});

inputCantidad.addEventListener('blur', () => {
  let val = parseInt(inputCantidad.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > stockActual) val = stockActual;
  inputCantidad.value = val;
});

agregarCarritoBtn.addEventListener('click', () => {
  const tallaSeleccionada = selectTalla.value;
  const cantidad = parseInt(inputCantidad.value, 10);

  if (!tallaSeleccionada) {
    mostrarToast('Por favor selecciona una talla.');
    return;
  }
  if (isNaN(cantidad) || cantidad < 1) {
    mostrarToast('Por favor ingresa una cantidad válida.');
    return;
  }
  if (cantidad > stockActual) {
    mostrarToast(`No puedes agregar más de ${stockActual} unidades disponibles.`);
    return;
  }

  const indexExistente = carrito.findIndex(item => item.id === productoId && item.talla === tallaSeleccionada);

  if (indexExistente >= 0) {
    const nuevoTotal = carrito[indexExistente].cantidad + cantidad;
    if (nuevoTotal > stockActual) {
      mostrarToast(`No puedes tener más de ${stockActual} unidades de este producto en el carrito.`);
      return;
    }
    carrito[indexExistente].cantidad = nuevoTotal;
  } else {
    carrito.push({
      id: productoId,
      nombre: nombreEl.textContent,
      precio: parseFloat(precioEl.textContent),
      imagen: producto.imagen || '', // se usa solo la imagen principal
      talla: tallaSeleccionada,
      cantidad: cantidad,
      stock: stockActual
    });
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));

  mostrarToast(`Agregaste "${nombreEl.textContent}" (talla ${tallaSeleccionada}) al carrito.`);

  inputCantidad.value = 1;
});

window.addEventListener('DOMContentLoaded', () => {
  cargarProducto(productoId);
});

function mostrarToast(mensaje) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('toast-container');
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = mensaje;
  container.appendChild(toast);

  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}
