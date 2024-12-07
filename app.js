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
  document.getElementById("overlay").style.display = 'block'; // Mostrar el fondo oscuro
  document.getElementById("orderForm").style.display = "block"; // Mostrar el formulario
});

// Cerrar el formulario al hacer clic fuera de él
document.getElementById("overlay").addEventListener("click", (event) => {
  if (event.target === document.getElementById("overlay")) {
    closeForm(); // Cierra el formulario si se hace clic en el fondo
  }
});

// Cerrar el formulario al presionar Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.getElementById("orderForm").style.display === "block") {
    closeForm(); // Cierra el formulario si está visible
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
    closeForm(); // Cerrar formulario después de agregar el pedido
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
  `;
  tbody.appendChild(row);

  // Asignar evento 'onchange' al select para actualizar el estado
  const selectStatus = row.querySelector('.order-status');
  selectStatus.addEventListener('change', (event) => {
    updateOrderStatus(category, orderId, order, event.target.value);
  });

  // Fila de notas
  const notesRow = document.createElement("tr");
  notesRow.classList.add("notes-row");
  notesRow.innerHTML = `<td colspan="4" class="notes-cell">${notes || "Sin notas"}</td>`;
  tbody.appendChild(notesRow);

  // Hacer que toda la fila de notas sea clickeable
  notesRow.addEventListener("click", () => {
    const notesCell = notesRow.querySelector(".notes-cell");
    const currentNotes = notesCell.textContent.trim();
    document.getElementById('popupTextarea').value = currentNotes;

    // Mostrar la ventana emergente
    document.getElementById('notesPopup').style.display = 'flex';
    document.getElementById('notesPopup').dataset.id = orderId;
    document.getElementById('notesPopup').dataset.category = category;
  });
}

// Actualizar estado de un pedido
function updateOrderStatus(category, orderId, order, newStatus) {
  update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus })
    .then(() => {
      if (newStatus === 'Entregado' || newStatus === 'No Entregado') {
        // Mover el pedido al historial
        push(ref(db, `historico/${category}`), {
          ...order, status: newStatus
        }).then(() => {
          // Eliminar el pedido de la tabla principal
          remove(ref(db, `pedidos/${category}/${orderId}`));
        });
      }
    })
    .catch(error => console.error("Error al actualizar el estado:", error));
}

// Función para cerrar la ventana emergente de notas
function closePopup() {
  document.getElementById('notesPopup').style.display = 'none';
}

// Cerrar la ventana emergente de notas cuando se haga clic fuera de ella
document.getElementById('notesPopup').addEventListener('click', (e) => {
  if (e.target === document.getElementById('notesPopup') || e.target.classList.contains('close-popup')) {
    closePopup();
  }
});

// Guardar las notas al hacer clic en el botón
document.getElementById('saveNotesButton').addEventListener('click', () => {
  const notesText = document.getElementById('popupTextarea').value;
  const orderId = document.getElementById('notesPopup').dataset.id;
  const category = document.getElementById('notesPopup').dataset.category;

  // Actualizar las notas en la base de datos
  update(ref(db, `pedidos/${category}/${orderId}`), { notes: notesText })
    .then(() => {
      closePopup(); // Cerrar popup después de guardar las notas
    })
    .catch(error => console.error("Error al guardar notas:", error));
});