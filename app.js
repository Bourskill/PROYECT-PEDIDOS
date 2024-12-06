import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

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
  document.getElementById("overlay").style.display = 'block';  // Mostrar el fondo oscuro
  document.getElementById("orderForm").style.display = "block";  // Mostrar el formulario
});

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
    closeForm();  // Cerrar formulario después de agregar el pedido
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

  // Fila de notas
  const notesRow = document.createElement("tr");
  notesRow.classList.add("notes-row");
  notesRow.innerHTML = `
    <td colspan="4" class="notes-cell">${notes || "Sin notas"}</td>
  `;
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

// Cerrar la ventana emergente de notas
document.getElementById('notesPopup').addEventListener('click', (e) => {
  if (e.target === document.getElementById('notesPopup') || e.target.classList.contains('close-popup')) {
    closePopup();
  }
});

// Función para cerrar la ventana emergente de notas
function closePopup() {
  document.getElementById('notesPopup').style.display = 'none';
}

// Guardar las notas editadas
document.getElementById('saveNotesButton').addEventListener('click', () => {
  const updatedNotes = document.getElementById('popupTextarea').value;
  const orderId = document.getElementById('notesPopup').dataset.id;
  const category = document.getElementById('notesPopup').dataset.category;

  update(ref(db, `pedidos/${category}/${orderId}`), { notes: updatedNotes })
    .then(() => {
      console.log("Notas actualizadas");

      // Actualizar la tabla con las notas nuevas
      const row = document.querySelector(`tr[data-id="${orderId}"]`);
      const notesCell = row.querySelector('.notes-cell');
      notesCell.textContent = updatedNotes;

      // Cerrar la ventana emergente
      closePopup();
    })
    .catch(error => console.error("Error al actualizar notas:", error));
});

// Mostrar el formulario con fondo oscuro
function showForm() {
  document.getElementById('overlay').style.display = 'block';  // Mostrar el fondo oscuro
  document.getElementById('orderForm').style.display = 'block';  // Mostrar el formulario
}

// Cerrar el formulario cuando se hace clic fuera de él o presionando Escape
document.getElementById('overlay').addEventListener('click', closeForm);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('orderForm').style.display === 'block') {
      closeForm();
    } else if (document.getElementById('notesPopup').style.display === 'flex') {
      closePopup();
    }
  }
});

function closeForm() {
  document.getElementById('overlay').style.display = 'none';  // Ocultar el fondo oscuro
  document.getElementById('orderForm').style.display = 'none';  // Ocultar el formulario
}


document.querySelectorAll('.view-history').forEach(button => {
  button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      showHistory(category);
  });
});

function showHistory(category) {
  const historyPopup = document.getElementById('historyPopup');
  const historyContent = document.getElementById('historyContent');
  historyContent.innerHTML = ''; // Limpiar contenido previo
  historyPopup.style.display = 'flex'; // Mostrar ventana emergente

  // Obtener pedidos de la categoría seleccionada
  onValue(ref(db, `pedidos/${category}`), (snapshot) => {
      const orders = snapshot.val();
      const groupedOrders = {}; // Agrupar por fecha

      if (orders) {
          Object.keys(orders).forEach(orderId => {
              const order = orders[orderId];
              if (order.status === 'Entregado' || order.status === 'No Entregado') {
                  const dateKey = order.date || 'Sin fecha';
                  if (!groupedOrders[dateKey]) groupedOrders[dateKey] = [];
                  groupedOrders[dateKey].push(order);
              }
          });
      }

      // Crear contenido agrupado por fecha
      Object.keys(groupedOrders).sort().forEach(dateKey => {
          // Encabezado de fecha
          const dateHeader = document.createElement('div');
          dateHeader.classList.add('date-header');
          dateHeader.textContent = new Date(dateKey).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
          });
          historyContent.appendChild(dateHeader);

          // Crear tabla para los pedidos
          const table = document.createElement('table');
          const tableHeader = `
              <thead>
                  <tr>
                      <th>Comanda</th>
                      <th>Cliente</th>
                      <th>Hora</th>
                      <th>Estado</th>
                  </tr>
              </thead>`;
          const tableBody = document.createElement('tbody');

          groupedOrders[dateKey].forEach(order => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${order.comanda || '-'}</td>
                  <td>${order.client || 'Anónimo'}</td>
                  <td>${order.time || 'Sin hora'}</td>
                  <td>${order.status}</td>
              `;
              tableBody.appendChild(row);
          });

          table.innerHTML = tableHeader;
          table.appendChild(tableBody);
          historyContent.appendChild(table);
      });
  });
}

document.getElementById('closeHistoryBtn').addEventListener('click', () => {
  document.getElementById('historyPopup').style.display = 'none';
});


// Cerrar ventana de historial al hacer clic fuera
document.getElementById('historyPopup').addEventListener('click', (e) => {
  if (e.target === document.getElementById('historyPopup')) {
    closeHistory();
  }
});

// Agregar al evento global para cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('historyPopup').style.display === 'flex') {
    closeHistory();
  }
});

// Función para cerrar el historial
function closeHistory() {
  document.getElementById('historyPopup').style.display = 'none';
}

