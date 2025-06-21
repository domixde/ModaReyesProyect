document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('menu-toggle');
  const menuLateral = document.getElementById('menu-lateral');

  if (!btnMenu || !menuLateral) return; // Evitar errores si no están en la página

  // Abrir / cerrar menú lateral al hacer clic en botón
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    menuLateral.classList.toggle('activo');

    // Actualizar aria-hidden para accesibilidad
    const isActive = menuLateral.classList.contains('activo');
    menuLateral.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  // Cerrar menú si clic fuera del menú o botón
  document.addEventListener('click', (e) => {
    if (!menuLateral.contains(e.target) && !btnMenu.contains(e.target)) {
      menuLateral.classList.remove('activo');
      menuLateral.setAttribute('aria-hidden', 'true');
    }
  });
});