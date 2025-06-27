// catalogo.js
// Importa las funciones necesarias de Firebase
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBspx-Hnnb-y-xXTr-z5lJj0_XEYppo2QM",
    authDomain: "modareyes-59991.firebaseapp.com",
    projectId: "modareyes-59991",
    storageBucket: "modareyes-59991.firebasestorage.app",
    messagingSenderId: "49086566305",
    appId: "1:49086566305:web:44a0a1cb688c25f1f385e0",
    measurementId: "G-CSN0MT6CXZ"
};

// Inicializa la aplicación Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

const productosContainer = document.getElementById('productos-container');
const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
const panelFiltros = document.getElementById('panel-filtros');
const contenedorPrincipal = document.querySelector('.contenedor-principal');
const categoriaBtns = document.querySelectorAll('.categoria-btn');
const btnBorrarFiltros = document.getElementById('btn-borrar-filtros');
const btnVerArticulos = document.getElementById('btn-ver-articulos');
const rangoPrecio = document.getElementById('rango-precio');
const valorPrecio = document.getElementById('valor-precio');
const btnBuscar = document.querySelector('.btn-buscar');
const busquedaContainer = document.getElementById('busqueda-container');
const inputBuscar = document.getElementById('input-buscar');
const btnMostrarMasTallas = document.getElementById('mostrar-mas-tallas');
const tallasOcultas = document.querySelector('.tallas-ocultas');
const btnMostrarMasColores = document.getElementById('mostrar-mas-colores');
const coloresOcultos = document.querySelector('.colores-ocultos');
const btnMostrarMasMateriales = document.getElementById('btn-mostrar-mas-materiales');
const materialesOcultos = document.querySelector('.materiales-ocultos');
const menuLateral = document.getElementById('menu-lateral');
const btnMenu = document.getElementById('menu-toggle');
const btnCarritoLink = document.getElementById('carrito-link');

const carritoVentana = document.getElementById('carrito-ventana');
const carritoItemsContainer = document.getElementById('carrito-items');
const carritoTotalImporte = document.getElementById('total-importe');
const btnCerrarCarrito = document.getElementById('cerrar-carrito');
const btnTramitar = document.getElementById('btn-tramitar');

// Crear y añadir el contador de carrito en el botón carrito
const carritoCantidadBoton = document.createElement('span');
carritoCantidadBoton.id = 'carrito-cantidad-boton';
carritoCantidadBoton.style.position = 'absolute';
carritoCantidadBoton.style.top = '0';
carritoCantidadBoton.style.right = '0';
carritoCantidadBoton.style.backgroundColor = '#b99623';
carritoCantidadBoton.style.color = 'white';
carritoCantidadBoton.style.fontWeight = '700';
carritoCantidadBoton.style.fontSize = '0.8rem';
carritoCantidadBoton.style.borderRadius = '50%';
carritoCantidadBoton.style.padding = '2px 6px';
carritoCantidadBoton.style.display = 'none';
btnCarritoLink.style.position = 'relative'; // necesario para posicionar el contador
btnCarritoLink.appendChild(carritoCantidadBoton);

actualizarCarritoUI();

let productosTodos = [];
let tallasDisponibles = []; // Aseguramos que tallasDisponibles exista para el filtro
let coloresDisponibles = [];
let materialesDisponibles = [];

let filtrosActivos = {
    categoria: '',
    tallas: new Set(),
    colores: new Set(),
    materiales: new Set(),
    precioMax: 80, // Asumiendo 80 es el valor inicial
    orden: '',
};

// Intersection Observer para Lazy Loading de imágenes de productos
const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '0px 0px 100px 0px', // Carga 100px antes de que la imagen entre en el viewport
    threshold: 0.01 // Activa cuando el 1% de la imagen es visible
});


// Inicializar botones de filtros (para elementos estáticos y dinámicos)
function initFiltrosBotones() {
    // Eventos para el botón de "Más tallas"
    btnMostrarMasTallas.addEventListener('click', () => {
        const oculto = tallasOcultas.hasAttribute('hidden');
        if (oculto) {
            tallasOcultas.removeAttribute('hidden');
            btnMostrarMasTallas.textContent = '- Menos tallas ▲';
        } else {
            tallasOcultas.setAttribute('hidden', '');
            btnMostrarMasTallas.textContent = '+ Más tallas ▼';
        }
    });

    // Eventos para el botón de "Más colores"
    btnMostrarMasColores.addEventListener('click', () => {
        const oculto = coloresOcultos.hasAttribute('hidden');
        if (oculto) {
            coloresOcultos.removeAttribute('hidden');
            btnMostrarMasColores.textContent = '- Menos colores ▲';
        } else {
            coloresOcultos.setAttribute('hidden', '');
            btnMostrarMasColores.textContent = '+ Más colores ▼';
        }
    });

    // Eventos para el botón de "Más materiales"
    btnMostrarMasMateriales.addEventListener('click', () => {
        const oculto = materialesOcultos.hasAttribute('hidden');
        if (oculto) {
            materialesOcultos.removeAttribute('hidden');
            btnMostrarMasMateriales.textContent = '- Menos materiales ▲';
        } else {
            materialesOcultos.setAttribute('hidden', '');
            btnMostrarMasMateriales.textContent = '+ Más materiales ▼';
        }
    });

    // Agregar eventos a botones de orden
    document.querySelectorAll('.filtro-ordenar button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-ordenar button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            filtrosActivos.orden = btn.dataset.orden;
            filtrarYMostrar();
            cerrarPanelFiltros(); // Cerrar el panel después de aplicar el filtro
        });
    });
}

btnBorrarFiltros.addEventListener('click', () => {
    // Reiniciar los filtros activos a su estado inicial
    filtrosActivos = {
        categoria: '',
        tallas: new Set(),
        colores: new Set(),
        materiales: new Set(),
        precioMax: 80, // Asegúrate de que este es el valor inicial de tu slider
        orden: '',
    };

    // Desactivar todas las categorías activas
    categoriaBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });
    // Activar categoría por defecto (vacía, "Todos los productos")
    const categoriaDefault = document.querySelector('.categoria-btn[data-categoria=""]');
    if (categoriaDefault) {
        categoriaDefault.classList.add('active');
        categoriaDefault.setAttribute('aria-selected', 'true');
    }

    // Desactivar todos los botones de filtros (tallas, colores, materiales)
    document.querySelectorAll('#panel-filtros .filtro-talla, #panel-filtros .filtro-color, #panel-filtros .filtro-material-btn').forEach(b => {
        b.classList.remove('active');
    });

    // Desactivar botones de orden
    document.querySelectorAll('.filtro-ordenar button').forEach(b => b.classList.remove('active'));

    // Reiniciar el valor y texto del rango de precio
    rangoPrecio.value = filtrosActivos.precioMax;
    valorPrecio.textContent = `Hasta S/${rangoPrecio.value}`;

    // Resetear visibilidad de "Más..." y sus textos para Tallas, Colores y Materiales
    tallasOcultas.setAttribute('hidden', '');
    btnMostrarMasTallas.textContent = '+ Más tallas ▼';

    coloresOcultos.setAttribute('hidden', '');
    btnMostrarMasColores.textContent = '+ Más colores ▼';
    btnMostrarMasColores.style.display = coloresDisponibles.length > 5 ? 'block' : 'none';

    materialesOcultos.setAttribute('hidden', '');
    btnMostrarMasMateriales.textContent = '+ Más materiales ▼';
    btnMostrarMasMateriales.style.display = materialesDisponibles.length > 3 ? 'block' : 'none';

    // Limpiar el campo de búsqueda y ocultar si estaba visible
    inputBuscar.value = '';
    busquedaContainer.setAttribute('hidden', '');

    // Volver a llamar a filtrarYMostrar() para actualizar la UI y los contadores
    filtrarYMostrar();
    btnBorrarFiltros.disabled = true; // Deshabilitar después de borrar todo
    btnBorrarFiltros.classList.remove('enabled');
});

function toggleFiltroSet(set, btn, valor) {
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        set.delete(valor);
    } else {
        btn.classList.add('active');
        set.add(valor);
    }
}

function mostrarProductos(productos) {
    productosContainer.innerHTML = ''; // Limpiar productos existentes

    // Desobservar cualquier imagen previamente observada para lazy loading
    productosContainer.querySelectorAll('img.lazy').forEach(img => {
        lazyLoadObserver.unobserve(img);
    });

    if (productos.length === 0) {
        productosContainer.innerHTML = '<p class="no-resultados">No se encontraron productos con los filtros aplicados.</p>';
        return;
    }

    productos.forEach(producto => {
        const div = document.createElement('div');
        div.classList.add('vestido');

        const imageUrl = producto.imagen || ''; // Asegura que la URL de la imagen no sea undefined
        const altText = producto.nombre || 'Producto'; // Asegura un texto alternativo

        // Uso de data-src para lazy loading
        div.innerHTML = `
            <img class="lazy" data-src="${imageUrl}" alt="${altText}" loading="lazy">
            <div class="info">
                <h3>${producto.nombre}</h3>
                <p>Categoría: ${producto.categoria}</p>
                <p>Precio: S/${producto.precio}</p>
                ${producto.stock > 0 
                    ? `<p>Stock: ${producto.stock}</p>` 
                    : `<p class="stock-agotado">Agotado</p>`
                }
                
                <div class="color-indicators"></div> 
                
                <button class="btn ver-detalle">Ver detalles</button>
            </div>
        `;

        const colorContainer = div.querySelector('.color-indicators');
        const colores = producto.colores || [];

        colores.forEach(color => {
            const colorDot = document.createElement('span');
            colorDot.classList.add('color-dot');
            colorDot.style.backgroundColor = color;
            colorDot.title = color;
            colorContainer.appendChild(colorDot);
        });

        const btnVerDetalle = div.querySelector('button.ver-detalle');
        btnVerDetalle.addEventListener('click', () => {
            window.location.href = `detalle.html?id=${producto.id}`;
        });

        productosContainer.appendChild(div);
        
        // Observar la imagen para lazy loading
        const imgElement = div.querySelector('img.lazy');
        if (imgElement) {
            lazyLoadObserver.observe(imgElement);
        }
    });
}

function mostrarTallasEnFiltro() {
    const tallasVisibles = document.querySelector('.filtro-tallas .tallas-visibles');
    const tallasOcultasContainer = document.querySelector('.filtro-tallas .tallas-ocultas');

    if (tallasVisibles) tallasVisibles.innerHTML = '';
    if (tallasOcultasContainer) tallasOcultasContainer.innerHTML = '';
    
    tallasDisponibles.forEach((talla, index) => {
        const botonTalla = document.createElement('button');
        botonTalla.classList.add('filtro-talla');
        botonTalla.setAttribute('data-talla', talla);
        botonTalla.textContent = `${talla}`; // Eliminado contador (0)
        
        // Mantener el estado activo de los botones de filtro
        if (filtrosActivos.tallas.has(talla)) {
            botonTalla.classList.add('active');
        }

        botonTalla.addEventListener('click', () => {
            toggleFiltroSet(filtrosActivos.tallas, botonTalla, talla);
            filtrarYMostrar();
            cerrarPanelFiltros(); // Cerrar el panel después de aplicar el filtro
        });

        if (index < 5) {
            if (tallasVisibles) tallasVisibles.appendChild(botonTalla);
        } else {
            if (tallasOcultasContainer) tallasOcultasContainer.appendChild(botonTalla);
        }
    });

    if (tallasDisponibles.length > 5) {
        btnMostrarMasTallas.style.display = 'block';
    } else {
        btnMostrarMasTallas.style.display = 'none';
        tallasOcultas.setAttribute('hidden', '');
        btnMostrarMasTallas.textContent = '+ Más tallas ▼';
    }
}

function mostrarColoresEnFiltro() {
    const coloresVisiblesContainer = document.querySelector('.colores-visibles');
    const coloresOcultosContainer = document.querySelector('.colores-ocultos');

    if (coloresVisiblesContainer) coloresVisiblesContainer.innerHTML = '';
    if (coloresOcultosContainer) coloresOcultosContainer.innerHTML = '';

    coloresDisponibles.forEach((color, index) => {
        const botonColor = document.createElement('button');
        botonColor.classList.add('filtro-color');
        botonColor.style.backgroundColor = color;
        botonColor.setAttribute('data-color', color);
        botonColor.title = color; // Título al pasar el mouse
        botonColor.textContent = ``; // Eliminado contador (0)

        // Mantener el estado activo de los botones de filtro
        if (filtrosActivos.colores.has(color)) {
            botonColor.classList.add('active');
        }

        botonColor.addEventListener('click', () => {
            toggleFiltroSet(filtrosActivos.colores, botonColor, color);
            filtrarYMostrar();
            cerrarPanelFiltros(); // Cerrar el panel después de aplicar el filtro
        });

        if (index < 5) {
            if (coloresVisiblesContainer) coloresVisiblesContainer.appendChild(botonColor);
        } else {
            if (coloresOcultosContainer) coloresOcultosContainer.appendChild(botonColor);
        }
    });

    if (coloresDisponibles.length > 5) {
        btnMostrarMasColores.style.display = 'block';
    } else {
        btnMostrarMasColores.style.display = 'none';
        coloresOcultos.setAttribute('hidden', '');
        btnMostrarMasColores.textContent = '+ Más colores ▼';
    }
}


function mostrarMaterialesEnFiltro() {
    const materialesVisiblesContainer = document.querySelector('.materiales-visibles');
    const materialesOcultosContainer = document.querySelector('.materiales-ocultos');

    if (!materialesVisiblesContainer) {
        console.error("El elemento con la clase 'materiales-visibles' no se encontró en el DOM.");
        return;
    }
    if (!materialesOcultosContainer) {
        console.error("El elemento con la clase 'materiales-ocultos' no se encontró en el DOM.");
        return;
    }

    materialesVisiblesContainer.innerHTML = '';
    materialesOcultosContainer.innerHTML = '';

    materialesDisponibles.forEach((material, index) => {
        const botonMaterial = document.createElement('button');
        botonMaterial.classList.add('filtro-material-btn');
        botonMaterial.textContent = `${material}`; // Eliminado contador (0)
        botonMaterial.setAttribute('data-material', material);
        
        // Mantener el estado activo de los botones de filtro
        if (filtrosActivos.materiales.has(material)) {
            botonMaterial.classList.add('active');
        }

        botonMaterial.addEventListener('click', () => {
            toggleFiltroSet(filtrosActivos.materiales, botonMaterial, material);
            filtrarYMostrar();
            cerrarPanelFiltros(); // Cerrar el panel después de aplicar el filtro
        });

        if (index < 3) {
            materialesVisiblesContainer.appendChild(botonMaterial);
        } else {
            materialesOcultosContainer.appendChild(botonMaterial);
        }
    });

    if (materialesDisponibles.length > 3) {
        btnMostrarMasMateriales.style.display = 'block';
    } else {
        btnMostrarMasMateriales.style.display = 'none';
        materialesOcultos.setAttribute('hidden', '');
        btnMostrarMasMateriales.textContent = '+ Más materiales ▼';
    }
}


function filtrarYMostrar() {
    let productosFiltrados = productosTodos;

    // Lógica de búsqueda prioritaria (ahora incluye color y material)
    if (!busquedaContainer.hasAttribute('hidden') && inputBuscar.value.trim() !== '') {
        const textoBusqueda = inputBuscar.value.trim().toLowerCase();
        productosFiltrados = productosTodos.filter(producto =>
            producto.nombre.toLowerCase().includes(textoBusqueda) ||
            (producto.colores && Array.isArray(producto.colores) && producto.colores.some(c => c.toLowerCase().includes(textoBusqueda))) ||
            (producto.material && typeof producto.material === 'string' && producto.material.toLowerCase().includes(textoBusqueda))
        );
        mostrarProductos(productosFiltrados);
        btnVerArticulos.textContent = `Ver ${productosFiltrados.length} artículos`;
        
        btnBorrarFiltros.disabled = true; // Deshabilita borrar filtros cuando la búsqueda está activa
        btnBorrarFiltros.classList.remove('enabled');
        return; 
    }

    // Aplicar filtros del panel
    if (filtrosActivos.categoria) {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === filtrosActivos.categoria);
    }
    if (filtrosActivos.tallas.size > 0) {
        productosFiltrados = productosFiltrados.filter(p => p.tallas && p.tallas.some(t => filtrosActivos.tallas.has(t)));
    }
    if (filtrosActivos.colores.size > 0) {
        productosFiltrados = productosFiltrados.filter(p => {
            return p.colores && Array.isArray(p.colores) && p.colores.some(color => filtrosActivos.colores.has(color.toLowerCase()));
        });
    }
    if (filtrosActivos.materiales.size > 0) {
        productosFiltrados = productosFiltrados.filter(p => {
            return p.material && typeof p.material === 'string' && filtrosActivos.materiales.has(p.material.toLowerCase());
        });
    }
    productosFiltrados = productosFiltrados.filter(p => p.precio <= filtrosActivos.precioMax);

    // Re-renderizar los filtros para asegurar el estado activo/inactivo (sin contadores)
    mostrarTallasEnFiltro();
    mostrarColoresEnFiltro();
    mostrarMaterialesEnFiltro();

    // Aplicar ordenamiento
    if (filtrosActivos.orden === 'precio-asc') {
        productosFiltrados.sort((a, b) => a.precio - b.precio);
    } else if (filtrosActivos.orden === 'precio-desc') {
        productosFiltrados.sort((a, b) => b.precio - a.precio);
    }

    mostrarProductos(productosFiltrados);
    btnVerArticulos.textContent = `Ver ${productosFiltrados.length} artículos`;

    // Habilitar/deshabilitar botón "Borrar filtros"
    const hayFiltrosActivos = filtrosActivos.categoria !== '' ||
                             filtrosActivos.tallas.size > 0 ||
                             filtrosActivos.colores.size > 0 ||
                             filtrosActivos.materiales.size > 0 ||
                             filtrosActivos.precioMax !== 80 || // Asumiendo 80 es el valor inicial
                             filtrosActivos.orden !== '';
    
    if (hayFiltrosActivos || inputBuscar.value.trim() !== '') {
        btnBorrarFiltros.disabled = false;
        btnBorrarFiltros.classList.add('enabled');
    } else {
        btnBorrarFiltros.disabled = true;
        btnBorrarFiltros.classList.remove('enabled');
    }
}

// Función para cerrar el panel de filtros con animación
function cerrarPanelFiltros() {
    if (panelFiltros.getAttribute('aria-hidden') === 'false') {
        panelFiltros.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        panelFiltros.style.opacity = '0';
        panelFiltros.style.transform = 'translateX(-110%)';
        setTimeout(() => {
            panelFiltros.setAttribute('aria-hidden', 'true');
            contenedorPrincipal.classList.remove('filtros-abiertos');
            btnToggleFiltros.setAttribute('aria-expanded', 'false');
        }, 350);
    }
}

// Toggle filtros con transición suave
btnToggleFiltros.addEventListener('click', () => {
    const abierto = panelFiltros.getAttribute('aria-hidden') === 'false';

    if (abierto) {
        cerrarPanelFiltros(); // Usa la función centralizada para cerrar
    } else {
        // Mostrar inmediatamente y luego animar
        panelFiltros.setAttribute('aria-hidden', 'false');
        contenedorPrincipal.classList.add('filtros-abiertos');
        btnToggleFiltros.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            panelFiltros.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            panelFiltros.style.opacity = '1';
            panelFiltros.style.transform = 'translateX(0)';
        });
    }
});

// Categorías botones
categoriaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoriaBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        filtrosActivos.categoria = btn.dataset.categoria || '';
        filtrarYMostrar();
        cerrarPanelFiltros(); // Cerrar el panel después de aplicar el filtro
    });
});

// Rango precio
rangoPrecio.addEventListener('input', () => {
    filtrosActivos.precioMax = parseInt(rangoPrecio.value, 10);
    valorPrecio.textContent = `Hasta S/${rangoPrecio.value}`;
    filtrarYMostrar();
    // No cerramos el panel aquí, ya que el usuario puede querer ajustar el rango varias veces.
    // Se cerrará si hace clic fuera o en otro filtro.
});

// Carga inicial
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos(); // Esta función ahora también cargará y mostrará los colores y materiales
    initFiltrosBotones();
    busquedaContainer.setAttribute('hidden', '');
    inputBuscar.value = '';
    // Asegurarse de que el rango de precio se inicialice visualmente
    rangoPrecio.value = filtrosActivos.precioMax;
    valorPrecio.textContent = `Hasta S/${rangoPrecio.value}`;
});

// Cargar productos desde Firebase
async function cargarProductos() {
    const productosRef = collection(db, "productos");
    const querySnapshot = await getDocs(productosRef);

    productosTodos = [];
    let tallasUnicas = new Set();
    let coloresUnicos = new Set();
    let materialesUnicos = new Set();

    querySnapshot.forEach((doc) => {
        const producto = doc.data();
        producto.id = doc.id;
        productosTodos.push(producto);

        // Recolectar tallas
        if (producto.tallas && Array.isArray(producto.tallas)) {
            producto.tallas.forEach(talla => tallasUnicas.add(talla));
        }

        // Recolectar colores (asegurando minúsculas y que sea un array)
        if (producto.colores && Array.isArray(producto.colores)) {
            producto.colores.forEach(color => coloresUnicos.add(color.toLowerCase()));
        } else {
            console.warn(`Producto ${producto.id} no tiene un array de colores válido o el campo está ausente:`, producto.colores);
        }

        // Recolectar materiales (asegurando minúsculas y que sea un string)
        if (producto.material && typeof producto.material === 'string') {
            materialesUnicos.add(producto.material.toLowerCase());
        } else {
            console.warn(`Producto ${producto.id} no tiene un material válido o el campo está ausente:`, producto.material);
        }
    });

    tallasDisponibles = Array.from(tallasUnicas).sort();
    coloresDisponibles = Array.from(coloresUnicos).sort();
    materialesDisponibles = Array.from(materialesUnicos).sort();

    // Llenar los filtros con los datos recopilados
    mostrarTallasEnFiltro();
    mostrarColoresEnFiltro();
    mostrarMaterialesEnFiltro();

    filtrarYMostrar(); // Llamar a filtrarYMostrar después de cargar los productos y establecer las listas de disponibles
}

// Scroll para ocultar título tienda
window.addEventListener('scroll', () => {
    const titulo = document.querySelector('.titulo-tienda');
    if (!titulo) return;

    if (window.scrollY > 50) {
        titulo.style.opacity = '0';
        titulo.style.pointerEvents = 'none';
    } else {
        titulo.style.opacity = '1';
        titulo.style.pointerEvents = 'auto';
    }
});

// Toggle búsqueda con transición suave
function toggleBusqueda() {
    if (busquedaContainer.hasAttribute('hidden')) {
        busquedaContainer.removeAttribute('hidden');
        busquedaContainer.style.opacity = '0';
        inputBuscar.focus();
        requestAnimationFrame(() => {
            busquedaContainer.style.transition = 'opacity 0.35s ease';
            busquedaContainer.style.opacity = '1';
        });
    } else {
        busquedaContainer.style.transition = 'opacity 0.35s ease';
        busquedaContainer.style.opacity = '0';
        setTimeout(() => {
            busquedaContainer.setAttribute('hidden', '');
            inputBuscar.value = '';
            filtrarYMostrar(); // Restaurar catálogo al cerrar búsqueda
        }, 350);
    }
}

// Botón buscar toggle barra
btnBuscar.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita cierre inmediato
    toggleBusqueda();
});

// Cerrar barra búsqueda si clic fuera
document.addEventListener('click', (e) => {
    if (!busquedaContainer.contains(e.target) && !btnBuscar.contains(e.target)) {
        if (!busquedaContainer.hasAttribute('hidden')) {
            busquedaContainer.setAttribute('hidden', '');
            inputBuscar.value = '';
            filtrarYMostrar();
        }
    }
});

// Evitar cierre al clicar dentro del contenedor búsqueda
busquedaContainer.addEventListener('click', (e) => {
    e.stopPropagation();
});

// BÚSQUEDA EN TIEMPO REAL
inputBuscar.addEventListener('input', () => {
    filtrarYMostrar(); // Llama a filtrarYMostrar para aplicar la búsqueda (ahora incluye color/material)
});

// Abrir menú lateral al hacer click en botón menú
btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    menuLateral.classList.toggle('activo');

    // Actualizar aria-hidden para accesibilidad
    const isActive = menuLateral.classList.contains('activo');
    menuLateral.setAttribute('aria-hidden', isActive ? 'false' : 'true');
});

document.addEventListener('click', (e) => {
    if (!menuLateral.contains(e.target) && !btnMenu.contains(e.target)) {
        menuLateral.classList.remove('activo');
        menuLateral.setAttribute('aria-hidden', 'true');
    }
});

// Cerrar panel filtros si se clickea fuera (móvil)
document.addEventListener('click', (e) => {
    // Solo si el panel está abierto y visible
    if (!panelFiltros.hasAttribute('aria-hidden') || panelFiltros.getAttribute('aria-hidden') === 'false') {
        if (!panelFiltros.contains(e.target) && !btnToggleFiltros.contains(e.target) && !btnBorrarFiltros.contains(e.target) && !rangoPrecio.contains(e.target)) {
            // Se añaden exclusiones para el botón borrar filtros y el rango de precio
            cerrarPanelFiltros();
        }
    }
});

// Función para actualizar UI carrito
function actualizarCarritoUI() {
    const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);

    if (carritoCantidadBoton) {
        carritoCantidadBoton.textContent = totalCantidad;
        carritoCantidadBoton.style.display = totalCantidad > 0 ? 'inline-block' : 'none';
    }

    const carritoCantidadTexto = document.getElementById('carrito-cantidad');
    if (carritoCantidadTexto) {
        carritoCantidadTexto.textContent = totalCantidad;
    }

    if (carrito.length === 0) {
        carritoItemsContainer.innerHTML = `<p>Tu cesta está vacía</p>`;
        carritoTotalImporte.textContent = 'S/0.00';
        btnTramitar.disabled = true;
    } else {
        btnTramitar.disabled = false;
        carritoItemsContainer.innerHTML = '';
        let total = 0;

        carrito.forEach((item, index) => {
            total += item.precio * item.cantidad;

            const div = document.createElement('div');
            div.classList.add('carrito-item');

            const esVideo = item.imagen && (item.imagen.endsWith('.mp4') || item.imagen.endsWith('.webm') || item.imagen.endsWith('.ogg'));

            const mediaElement = esVideo
                ? `<video class="carrito-media" autoplay muted loop playsinline>
                        <source src="${item.imagen}" type="video/mp4">
                        Tu navegador no soporta video.
                      </video>`
                : `<img src="${item.imagen}" alt="${item.nombre}" class="carrito-media" />`;

            div.innerHTML = `
                ${mediaElement}
                <div class="carrito-info">
                    <h3>${item.nombre}</h3>
                    <p><strong>Precio:</strong> S/${item.precio.toFixed(2)}</p>
                    <p><strong>Cantidad:</strong> 
                        <button class="btn-cantidad" data-index="${index}" data-accion="restar" aria-label="Disminuir cantidad">-</button>
                        ${item.cantidad}
                        <button class="btn-cantidad" data-index="${index}" data-accion="sumar" aria-label="Aumentar cantidad">+</button>
                    </p>
                    <p><strong>Talla:</strong> ${item.talla}</p>
                </div>
                <button class="btn-eliminar" data-index="${index}" aria-label="Eliminar producto">&times;</button>
            `;

            carritoItemsContainer.appendChild(div);
        });

        carritoTotalImporte.textContent = 'S/' + total.toFixed(2);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    carritoItemsContainer.querySelectorAll('.btn-cantidad').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            const accion = btn.dataset.accion;

            if (accion === 'sumar') {
                if (carrito[idx].cantidad < carrito[idx].stock) {
                    carrito[idx].cantidad++;
                } else {
                    mostrarToast(`No puedes agregar más unidades. Stock máximo: ${carrito[idx].stock}`);
                }
            } else if (accion === 'restar' && carrito[idx].cantidad > 1) {
                carrito[idx].cantidad--;
            }
            actualizarCarritoUI();
        });
    });

    carritoItemsContainer.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            carrito.splice(idx, 1);
            actualizarCarritoUI();
        });
    });
}

// Funciones para abrir y cerrar carrito con inert y manejo de foco
function abrirCarrito() {
    carritoVentana.removeAttribute('hidden');
    carritoVentana.setAttribute('aria-hidden', 'false');
    carritoVentana.removeAttribute('inert');
    actualizarCarritoUI();
}

function cerrarCarrito() {
    carritoVentana.setAttribute('hidden', '');
    carritoVentana.setAttribute('aria-hidden', 'true');
    carritoVentana.setAttribute('inert', '');
    btnCerrarCarrito.blur(); // Quitar foco para evitar advertencia
}

// Abrir/cerrar carrito con botón
btnCarritoLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (carritoVentana.hasAttribute('hidden')) {
        abrirCarrito();
    } else {
        cerrarCarrito();
    }
});

// Cerrar carrito con botón cerrar
btnCerrarCarrito.addEventListener('click', () => {
    cerrarCarrito();
});

// Cerrar carrito si clic afuera
document.addEventListener('click', (e) => {
    if (!carritoVentana.contains(e.target) && e.target !== btnCarritoLink) {
        cerrarCarrito();
    }
});

// Evitar cierre al hacer click dentro del carrito (importante)
carritoVentana.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Botón tramitar pedido por WhatsApp
btnTramitar.addEventListener('click', () => {
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    let mensaje = '*Hola! Quiero hacer un pedido:*\n\n';

    carrito.forEach(item => {
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        mensaje += `*${item.nombre}*\n`;
        mensaje += `- Talla: ${item.talla}\n`;
        mensaje += `- Cantidad: ${item.cantidad}\n`;
        mensaje += `- Precio unitario: S/${item.precio.toFixed(2)}\n`;
        mensaje += `- Subtotal: S/${subtotal}\n`;
        mensaje += `- Imagen: ${item.imagen}\n\n`;
    });

    mensaje += '*¡Gracias!*';

    const numeroWhatsApp = "51917998856";
    const urlWhatsapp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsapp, '_blank');
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
