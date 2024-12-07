// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA",
  authDomain: "pedidos-iag.firebaseapp.com",
  databaseURL: "https://pedidos-iag-default-rtdb.firebaseio.com",
  projectId: "pedidos-iag",
  storageBucket: "pedidos-iag.firebasestorage.app",
  messagingSenderId: "775813436384",
  appId: "1:775813436384:web:4dba50e3fed84354e11185"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Mostrar formulario de pedido
document.getElementById("makeOrderBtn").addEventListener("click", () => {
  document.getElementById("overlay").style.display = 'block';
  document.getElementById("orderForm").style.display = "block";
});

// Cerrar el formulario al hacer clic fuera de él
document.getElementById("overlay").addEventListener("click", (event) => {
  if (event.target === document.getElementById("overlay")) {
    closeForm();
  }
});

// Cerrar el formulario al presionar Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.getElementById("orderForm").style.display === "block") {
    closeForm();
  }
});

// Cerrar el formulario de pedidos
function closeForm() {
  document.getElementById("orderForm").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

// Agregar un nuevo pedido
document.getElementById("addOrderBtn").addEventListener("click", () => {
  const client = document.getElementById("client").value;
  const number = document.getElementById("number").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const category = document.getElementById("category").value;
  const comanda = document.getElementById("comanda").value;
  const person = document.getElementById("person").value;
  const notes = document.getElementById("notes").value;
  const status = "Por Revisar";

  if (!client || !number || !date || !time) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }

  push(ref(db, `pedidos/${category}`), {
    client,
    number,
    date,
    time,
    category,
    comanda,
    person,
    notes,
    status
  }).then(() => {
    closeForm();
  }).catch(error => console.error("Error al agregar pedido:", error));
});

// Escuchar cambios en Firebase
onValue(ref(db, "pedidos"), (snapshot) => {
  const orders = snapshot.val();
  document.querySelectorAll("table tbody").forEach(tbody => tbody.innerHTML = "");

  if (orders) {
    Object.keys(orders).forEach(category => {
      const categoryOrders = orders[category];
      Object.keys(categoryOrders).forEach(orderId => {
        const order = categoryOrders[orderId];
        addOrderToTable(order, orderId, category);
      });
    });
  }
});

// Función para formatear la fecha y hora separadas por un guion
function formatDate(dateString, timeString) {
  const date = new Date(dateString + "T" + timeString);
  const optionsDate = { month: 'long', day: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };

  const formattedDate = date.toLocaleDateString('es-ES', optionsDate);
  const formattedTime = date.toLocaleTimeString('es-ES', optionsTime).replace('AM', 'a. m.').replace('PM', 'p. m.');

  return `${formattedDate} - ${formattedTime}`;
}

// Agregar pedidos a la tabla
function addOrderToTable(order, orderId, category) {
  const { client, number, date, time, comanda, person, notes, status } = order;
  const table = document.getElementById(category);

  if (!table) {
    console.warn(`La tabla con el id "${category}" no existe.`);
    return;
  }

  const tbody = table.querySelector("tbody");
  const row = document.createElement("tr");
  row.dataset.id = orderId;

  // Formatear la fecha y hora antes de insertarla
  const formattedDateTime = formatDate(date, time);

  row.innerHTML = `
    <td>${comanda ? `#${comanda}<br>${person}` : ""}</td>
    <td>${client}<br>${number}</td>
    <td>${formattedDateTime}</td>
    <td>
      <select class="order-status">
        <option value="Por Revisar" ${status === "Por Revisar" ? "selected" : ""}>Por Revisar</option>
        <option value="Revisado" ${status === "Revisado" ? "selected" : ""}>Revisado</option>
        <option value="Por Aprobar" ${status === "Por Aprobar" ? "selected" : ""}>Por Aprobar</option>
        <option value="En Proceso" ${status === "En Proceso" ? "selected" : ""}>En Proceso</option>
        <option value="Entregado" ${status === "Entregado" ? "selected" : ""}>Entregado</option>
        <option value="No Entregado" ${status === "No Entregado" ? "selected" : ""}>No Entregado</option>
      </select>
    </td>
    <td class="notes-cell">${notes}</td>
  `;
  tbody.appendChild(row);

  const selectStatus = row.querySelector('.order-status');
  selectStatus.addEventListener('change', (event) => {
    updateOrderStatus(category, orderId, order, event.target.value);
  });

  // Abrir notas al hacer clic en la celda
  const notesCell = row.querySelector('.notes-cell');
  notesCell.addEventListener('click', () => openNotesPopup(notes));
}

// Manejo de popup de notas
const notesPopup = document.getElementById('notesPopup');
const overlay = document.getElementById('overlay');

function openNotesPopup(notes) {
  notesPopup.querySelector('.notes-content').innerText = notes || 'Sin notas';
  notesPopup.style.display = 'block';
  overlay.style.display = 'block';
}

function closeNotesPopup() {
  notesPopup.style.display = 'none';
  overlay.style.display = 'none';
}

document.getElementById('closeNotesBtn').addEventListener('click', closeNotesPopup);

document.addEventListener('keydown', (event) => {
  if (event.key === "Escape" && notesPopup.style.display === 'block') {
    closeNotesPopup();
  }
});

overlay.addEventListener('click', (event) => {
  if (notesPopup.style.display === 'block' && event.target === overlay) {
    closeNotesPopup();
  }
});