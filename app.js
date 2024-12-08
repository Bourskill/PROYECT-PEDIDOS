// Configuración inicial de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

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

// Mostrar pedidos activos
document.getElementById("showOrdersBtn").addEventListener("click", () => {
  const ordersContainer = document.getElementById("ordersContainer");
  ordersContainer.innerHTML = ""; // Limpiar contenido previo

  onValue(ref(db, "pedidos"), (snapshot) => {
    const orders = snapshot.val();

    if (orders) {
      Object.keys(orders).forEach((orderId) => {
        const order = orders[orderId];
        addOrderRow(order, orderId);
      });
    } else {
      ordersContainer.innerHTML = "<p>No hay pedidos activos.</p>";
    }
  });
});

// Agregar una fila de pedido
function addOrderRow(order, orderId) {
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
}

// Actualizar estado de un pedido
function updateOrderStatus(category, orderId, order, newStatus) {
  update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus })
    .then(() => {
      alert("Pedido marcado como entregado.");
      moveToHistory(orderId); // Mover al historial
    })
    .catch((error) => {
      console.error("Error al actualizar el pedido:", error);
    });
}

// Mostrar el historial de pedidos
function loadHistoryPopup(category) {
  const historyContainer = document.getElementById('historyContent');
  historyContainer.innerHTML = ''; // Limpiar el contenedor antes de llenarlo

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Crear encabezados de la tabla sin notas
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Comanda</th>
    <th>Cliente</th>
    <th>Fecha/Hora</th>
    <th>Estado</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  table.appendChild(tbody);

  // Obtener datos históricos de Firebase
  onValue(ref(db, `historico/${category}`), (snapshot) => {
    const historyOrders = snapshot.val();

    if (historyOrders) {
      Object.keys(historyOrders).forEach(orderId => {
        const order = historyOrders[orderId];
        const row = document.createElement('tr');

        // Formatear la fecha y hora
        const formattedDateTime = formatDate(order.date, order.time);

        row.innerHTML = `
          <td>${order.comanda ? `#${order.comanda}<br>${order.person}` : ""}</td>
          <td>${order.client}<br>${order.number}</td>
          <td>${formattedDateTime}</td>
          <td>${order.status}</td>
        `;

        tbody.appendChild(row);
      });
    }
  });

  historyContainer.appendChild(table);

  // Mostrar el popup
  document.getElementById('historyPopup').style.display = 'flex';
  document.getElementById('overlay').style.display = 'block'; // Mostrar fondo oscuro
}

// Evento para cerrar el historial al hacer clic fuera del popup
document.getElementById("overlay").addEventListener("click", (event) => {
  const historyPopup = document.getElementById("historyPopup");
  const orderForm = document.getElementById("orderForm");

  if (event.target === document.getElementById("overlay")) {
    if (historyPopup.style.display === 'flex') {
      closeHistoryPopup(); // Cierra el historial si está abierto
    } else if (orderForm.style.display === 'block') {
      closeForm(); // Cierra el formulario si está abierto
    }
  }
});

// Evento para cerrar el historial al presionar Escape
document.addEventListener("keydown", (event) => {
  const historyPopup = document.getElementById("historyPopup");
  if (event.key === "Escape" && historyPopup.style.display === "flex") {
    closeHistoryPopup(); // Cierra el historial si está visible
  }
});

// Cerrar el popup de historial
function closeHistoryPopup() {
  document.getElementById("historyPopup").style.display = 'none'; // Ocultar el popup
  document.getElementById("overlay").style.display = 'none'; // Ocultar el fondo oscuro
}

// Botones para abrir el historial de cada categoría
document.querySelectorAll('.view-history').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;
    loadHistoryPopup(category); // Cargar los datos del historial
  });
});
