document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.querySelector(".form-contacto");

  formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.querySelector("#nombre").value.trim();
    const email = document.querySelector("#email").value.trim();
    const mensaje = document.querySelector("#mensaje").value.trim();

    // Reemplaza con tu número real de WhatsApp, sin símbolos, con código de país (por ejemplo: 5491123456789)
    const numeroWhatsApp = "51928522337";

    const texto = `Hola, soy ${nombre}. Mi correo es ${email}. Quisiera decir lo siguiente:\n${mensaje}`;
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank");
  });
});
