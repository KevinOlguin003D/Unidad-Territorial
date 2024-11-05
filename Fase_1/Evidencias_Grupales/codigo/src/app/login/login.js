document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const correoInput = document.getElementById("correo");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");

  // Verifica si el formulario es válido
  function checkFormValidity() {
      const isValid = correoInput.value.trim() !== '' && passwordInput.value.trim() !== '';
      loginButton.disabled = !isValid;
  }

  correoInput.addEventListener("input", checkFormValidity);
  passwordInput.addEventListener("input", checkFormValidity);

  loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const loginData = {
          correo: correoInput.value,
          password: passwordInput.value
      };

      fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
          
      })
      .then(response => response.json()) 
      .then(data => {
          if (data.redirect) {
              window.location.href = data.redirect;
          } else {
              console.error('Inicio de sesión fallido');
              alert("Correo o contraseña incorrectos");
          }
      })
      .catch(error => {
          console.error('Error:', error);
      });
  });
});
