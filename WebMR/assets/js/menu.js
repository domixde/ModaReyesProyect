// menu.js
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const titulo = document.querySelector('.titulo-tienda');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 50) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const buscarContenedor = document.querySelector('.btn-buscar-container');

  if (!buscarContenedor) return; // Si no existe, salir

  if (body.classList.contains('con-busqueda')) {
    buscarContenedor.style.display = 'block';
  } else {
    buscarContenedor.style.display = 'none';
  }
});
