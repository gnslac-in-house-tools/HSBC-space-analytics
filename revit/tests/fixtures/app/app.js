// app.js: lee los datos del marcador
const raw = document.getElementById("space-model-data").textContent;
const data = JSON.parse(raw);
const tag = "</script>";  // no debe cerrar el <script> al quedar dentro
const swap = "a$1b\1c".replace(/\$1/, "$&");
