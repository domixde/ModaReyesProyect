// Importa las funciones necesarias de Firebase
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    limit,
    getDocs,
} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
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
const stockEl = document.getElementById('stock');
const descripcionEl = document.getElementById('descripcion');
const agregarCarritoBtn = document.getElementById('agregar-carrito');

const flechaIzquierda = document.querySelector('.flecha.izquierda');
const flechaDerecha = document.querySelector('.flecha.derecha');

const tallasBotonesContainer = document.getElementById('tallas-botones-container');
const inputCantidad = document.getElementById('input-cantidad');

const coloresContainer = document.getElementById('colores-container');
const materialEl = document.getElementById('material');

const productosRelacionadosContainer = document.getElementById('productos-relacionados-container');


let imagenes = [];
let indiceImagen = 0;
let stockActual = 0;
let videoActual = null;
let producto = null;
let tallaSeleccionadaActual = '';

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

    producto = docSnap.data();

    nombreEl.textContent = producto.nombre || "";
    categoriaEl.textContent = producto.categoria || "";
    precioEl.textContent = producto.precio || "";
    descripcionEl.textContent = producto.descripcion || "";

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

    const tallasArray = Array.isArray(producto.tallas) ? producto.tallas : [];
    tallasBotonesContainer.innerHTML = '';
    tallaSeleccionadaActual = '';

    if (tallasArray.length === 0) {
        tallasBotonesContainer.innerHTML = '<span class="no-tallas-disponibles">No disponible</span>';
        agregarCarritoBtn.disabled = true;
    } else {
        tallasArray.forEach(talla => {
            const button = document.createElement('button');
            button.classList.add('talla-btn');
            button.textContent = talla;
            button.dataset.talla = talla;

            button.addEventListener('click', () => {
                document.querySelectorAll('.talla-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                tallaSeleccionadaActual = talla;
                agregarCarritoBtn.disabled = false;
            });
            tallasBotonesContainer.appendChild(button);
        });
        agregarCarritoBtn.disabled = true;
    }

    if (producto.colores && coloresContainer) {
        coloresContainer.innerHTML = '';
        producto.colores.forEach(color => {
            const colorDot = document.createElement('span');
            colorDot.classList.add('color-dot');
            colorDot.style.backgroundColor = color;
            colorDot.title = color;
            coloresContainer.appendChild(colorDot);
        });
    } else if (coloresContainer) {
        coloresContainer.innerHTML = 'N/A';
    }

    if (materialEl) {
        materialEl.textContent = producto.material || 'N/A';
    }

    if (producto.categoria) {
        cargarProductosRelacionados(
            producto.categoria,
            productoId,
            producto.material,
            producto.colores,
            producto.precio
        );
    }
}

function mostrarImagen(indice) {
    if (imagenes.length === 0) return;

    if (indice < 0) {
        indiceImagen = imagenes.length - 1;
    } else if (indice >= imagenes.length) {
        indiceImagen = 0;
    } else {
        indiceImagen = indice;
    }

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
    const tallaSeleccionada = tallaSeleccionadaActual;
    const cantidad = parseInt(inputCantidad.value, 10);

    if (!tallaSeleccionada) {
        mostrarToast('warning', 'Por favor selecciona una talla.');
        return;
    }
    if (isNaN(cantidad) || cantidad < 1) {
        mostrarToast('warning', 'Por favor ingresa una cantidad válida.');
        return;
    }
    if (cantidad > stockActual) {
        mostrarToast('warning', `No puedes agregar más de ${stockActual} unidades disponibles.`);
        return;
    }

    const indexExistente = carrito.findIndex(item => item.id === productoId && item.talla === tallaSeleccionada);

    if (indexExistente >= 0) {
        const nuevoTotal = carrito[indexExistente].cantidad + cantidad;
        if (nuevoTotal > stockActual) {
            mostrarToast('warning', `No puedes tener más de ${stockActual} unidades de este producto en el carrito.`);
            return;
        }
        carrito[indexExistente].cantidad = nuevoTotal;
    } else {
        carrito.push({
            id: productoId,
            nombre: nombreEl.textContent,
            precio: parseFloat(precioEl.textContent),
            imagen: producto.imagen || (producto.imagenes && producto.imagenes[0]) || '',
            talla: tallaSeleccionada,
            cantidad: cantidad,
            stock: stockActual
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Cambiado: Ahora solo pasamos el tipo 'success' y el mensaje. El tercer parámetro `showCartButton` se elimina o se deja por defecto como false.
    mostrarToast(
        'success',
        `Agregaste "${nombreEl.textContent}" (Talla ${tallaSeleccionada}, Cant. ${cantidad}) al carrito.`
    );

    inputCantidad.value = 1;
});

window.addEventListener('DOMContentLoaded', () => {
    cargarProducto(productoId);
});

// --- FUNCIÓN MEJORADA: mostrarToast (sin botón "Ver carrito") ---
function mostrarToast(type, message) { // Eliminado showCartButton de los parámetros
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.classList.add('custom-toast', `toast-${type}`); // Añade clase de tipo (success, warning)

    let iconClass = '';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
    } else if (type === 'warning') {
        iconClass = 'fas fa-exclamation-triangle';
    } else {
        iconClass = 'fas fa-info-circle'; // Default info
    }

    // Eliminada toda la lógica para el botón "Ver carrito"
    let buttonsHtml = ''; // No hay botones adicionales por defecto

    toast.innerHTML = `
        <div class="toast-content">
            <i class="${iconClass} toast-icon"></i>
            <span class="toast-message">${message}</span>
        </div>
        <div class="toast-actions">
            ${buttonsHtml}
            <button class="toast-close-btn">&times;</button>
        </div>
    `;

    container.appendChild(toast);

    // Forzar reflow para la animación
    void toast.offsetWidth;
    toast.classList.add('show');

    // Event listener para cerrar el toast
    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) { // Asegura que el toast todavía esté en el DOM antes de intentar removerlo
                container.removeChild(toast);
            }
        }, 300); // Coincide con la duración de la transición CSS
    });

    // Eliminada la parte del event listener para el botón "Ver carrito"

    // Auto-cierre después de un tiempo, a menos que el usuario interactúe
    setTimeout(() => {
        if (toast.classList.contains('show')) { // Solo si aún está visible
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }
    }, 5000); // 5 segundos de visibilidad
}


async function cargarProductosRelacionados(categoria, idExcluido, materialProducto, coloresProducto, precioProducto) {
    if (!productosRelacionadosContainer) {
        console.warn("Contenedor de productos relacionados no encontrado.");
        return;
    }
    productosRelacionadosContainer.innerHTML = '<p class="cargando-relacionados">Cargando productos relacionados...</p>';

    const productosRef = collection(db, "productos");
    let productosRelacionados = new Map(); // Usamos un Map para desduplicar por ID

    try {
        // --- Consulta 1: Por misma categoría (base) ---
        const qCategoria = query(
            productosRef,
            where("categoria", "==", categoria),
            limit(8) // Obtener más para tener opciones después de filtrar
        );
        const snapshotCategoria = await getDocs(qCategoria);
        snapshotCategoria.forEach((doc) => {
            if (doc.id !== idExcluido) {
                productosRelacionados.set(doc.id, { id: doc.id, ...doc.data() });
            }
        });

        // --- Consulta 2: Misma categoría Y mismo material (si existe) ---
        if (materialProducto) {
            const qMaterial = query(
                productosRef,
                where("categoria", "==", categoria),
                where("material", "==", materialProducto),
                limit(5)
            );
            const snapshotMaterial = await getDocs(qMaterial);
            snapshotMaterial.forEach((doc) => {
                if (doc.id !== idExcluido) {
                    productosRelacionados.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }

        // --- Consulta 3: Misma categoría Y alguno de los mismos colores (si existen) ---
        if (coloresProducto && coloresProducto.length > 0) {
            const qColores = query(
                productosRef,
                where("categoria", "==", categoria),
                where("colores", "array-contains-any", coloresProducto),
                limit(5)
            );
            const snapshotColores = await getDocs(qColores);
            snapshotColores.forEach((doc) => {
                if (doc.id !== idExcluido) {
                    productosRelacionados.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }

        // --- Consulta 4: Misma categoría Y rango de precio similar ---
        if (precioProducto) {
            const precioMin = precioProducto * 0.9;
            const precioMax = precioProducto * 1.1;

            const qPrecio = query(
                productosRef,
                where("categoria", "==", categoria),
                where("precio", ">=", precioMin),
                where("precio", "<=", precioMax),
                limit(5)
            );
            const snapshotPrecio = await getDocs(qPrecio);
            snapshotPrecio.forEach((doc) => {
                if (doc.id !== idExcluido) {
                    productosRelacionados.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        }

        const productosFinales = Array.from(productosRelacionados.values()).slice(0, 5);

        if (productosFinales.length === 0) {
            productosRelacionadosContainer.innerHTML = '<p class="no-relacionados">No hay productos relacionados disponibles.</p>';
            return;
        }

        productosRelacionadosContainer.innerHTML = '';

        productosFinales.forEach(relacionado => {
            const div = document.createElement('div');
            div.classList.add('producto-relacionado-card');

            const imageUrl = relacionado.imagen || (relacionado.imagenes && relacionado.imagenes[0]) || '';
            const altText = relacionado.nombre || 'Producto relacionado';

            div.innerHTML = `
                <a href="detalle.html?id=${relacionado.id}" class="related-product-link">
                    <img src="${imageUrl}" alt="${altText}" loading="lazy">
                    <h3>${relacionado.nombre}</h3>
                    <p>S/${relacionado.precio}</p>
                </a>
            `;
            productosRelacionadosContainer.appendChild(div);
        });

    } catch (error) {
        console.error("Error al cargar productos relacionados:", error);
        productosRelacionadosContainer.innerHTML = '<p class="error-relacionados">Error al cargar productos relacionados.</p>';
    }
}
