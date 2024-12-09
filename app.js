import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

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
  document.getElementById("overlay").style.display = 'flex'; 
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

// Función para cerrar el formulario
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

// Escuchar cambios en Firebase y actualizar la tabla
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

// Función para agregar los pedidos a la tabla
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

  // Asignar evento para actualizar el estado
  const selectStatus = row.querySelector('.order-status');
  selectStatus.addEventListener('change', (event) => {
    updateOrderStatus(category, orderId, order, event.target.value);
  });

  const notesRow = document.createElement("tr");
  notesRow.classList.add("notes-row");
  notesRow.innerHTML = `<td colspan="4" class="notes-cell">${notes || "Sin notas"}</td>`;
  tbody.appendChild(notesRow);

  // Hacer que la fila de notas sea clickeable
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

// Función para formatear la fecha y hora en el formato "12 de Diciembre - 7:00pm"
function formatDate(dateString, timeString) {
  const date = new Date(dateString); // Convierte la fecha a objeto Date

  // Meses en español
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Obtener el día y mes
  const day = date.getDate();
  const month = months[date.getMonth()]; // Obtener el mes en español

  // Separar y convertir la hora
  const [hours, minutes] = timeString.split(":");
  let hour = parseInt(hours, 10);
  const isPM = hour >= 12; // Determinar si es PM
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }

  const formattedTime = `${hour}:${minutes} ${isPM ? "pm" : "am"}`;

  // Retornar en el formato deseado
  return `${day} de ${month} - ${formattedTime}`;
}

// Actualizar estado de un pedido
function updateOrderStatus(category, orderId, order, newStatus) {
  // Actualizar el estado en Firebase
  update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus })
    .then(() => {
      // Si el estado cambia a "Entregado" o "No Entregado"
      if (newStatus === "Entregado" || newStatus === "No Entregado") {
        // Mover el pedido al historial
        push(ref(db, `historico/${category}`), {
          ...order, status: newStatus
        })
        .then(() => {
          // Eliminar el pedido de la tabla principal en Firebase
          remove(ref(db, `pedidos/${category}/${orderId}`))
            .then(() => {
              // Aquí eliminamos el pedido de la tabla en la interfaz
              // Esto es necesario porque Firebase no se actualiza en tiempo real
              // en la vista hasta que recargue los datos.
              // Aquí puedes agregar un código para eliminar la fila de la tabla en la UI.
              const row = document.querySelector(`[data-id="${orderId}"]`);
              if (row) {
                row.remove(); // Eliminar la fila de la tabla
              }
            })
            .catch(error => console.error("Error al eliminar el pedido:", error));
        })
        .catch((error) => console.error("Error al mover el pedido al historial:", error));
      }
    })
    .catch(error => {
      console.error("Error al actualizar el estado del pedido:", error);
    });
}

// Mover pedidos al historial
function moveToHistory(category, orderId, order) {
  set(ref(db, `historico/${category}/${orderId}`), order)
    .then(() => remove(ref(db, `pedidos/${category}/${orderId}`)))
    .catch((error) => console.error("Error al mover al historial:", error));
}

function loadHistoryPopup(category) {
  const historyContainer = document.getElementById('historyContent');
  historyContainer.innerHTML = ''; // Limpiar el contenedor antes de llenarlo

  // Crear la tabla
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Crear encabezados de la tabla
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
      // Agrupar los pedidos por fecha
      const groupedOrders = groupOrdersByDate(historyOrders);

      // Iterar sobre las fechas agrupadas
      Object.keys(groupedOrders).forEach(date => {
        const dateGroup = groupedOrders[date];
        
        // Crear una fila para la fecha
        const dateRow = document.createElement('tr');
        dateRow.classList.add('date-row');
        const dateCell = document.createElement('td');
        dateCell.colSpan = 4;
        dateCell.textContent = date;  // Mostrar la fecha como título
        dateCell.style.fontWeight = 'bold';  // Resaltar la fecha
        dateRow.appendChild(dateCell);
        tbody.appendChild(dateRow);

        // Crear filas para los pedidos de esa fecha
        dateGroup.forEach(order => {
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
      });
    }
  });

  historyContainer.appendChild(table);

  // Mostrar el popup
  document.getElementById('historyPopup').style.display = 'flex';
  document.getElementById('overlay').style.display = 'block'; // Mostrar fondo oscuro
}

// Función para agrupar los pedidos por fecha
function groupOrdersByDate(orders) {
  const grouped = {};

  Object.keys(orders).forEach(orderId => {
    const order = orders[orderId];
    const orderDate = new Date(order.date);
    
    // Formatear la fecha a "12 de Diciembre"
    const day = orderDate.getDate();
    const month = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ][orderDate.getMonth()];
    const dateKey = `${day} de ${month}`;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(order);
  });

  return grouped;
}

// Evento para cerrar el historial al hacer clic fuera del popup
document.getElementById("historyPopup").addEventListener("click", (event) => {
  console.log("holi")
  const historyPopup = document.getElementById("historyPopup");
  const orderForm = document.getElementById("orderForm"); 

  if (event.target === document.getElementById("historyPopup")) {
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

// Mostrar el popup con las notas al hacer clic en la fila de notas
document.querySelectorAll(".notes-row").forEach(row => {
  row.addEventListener("click", () => {
    const orderId = row.closest("tr").dataset.id;  // ID del pedido
    const category = row.closest("table").id;      // Categoría del pedido
    const notes = row.querySelector(".notes-cell").textContent.trim();
    
    // Mostrar las notas en el popup
    document.getElementById("popupTextarea").value = notes;
    document.getElementById("notesPopup").style.display = "flex";
    document.getElementById("notesPopup").dataset.id = orderId;
    document.getElementById("notesPopup").dataset.category = category;
  });
});

// Guardar las notas editadas en Firebase
document.getElementById("saveNotesButton").addEventListener("click", () => {
  const orderId = document.getElementById("notesPopup").dataset.id;
  const category = document.getElementById("notesPopup").dataset.category;
  const newNotes = document.getElementById("popupTextarea").value;

  if (newNotes !== '') {
    // Actualizar las notas en la base de datos de Firebase
    update(ref(db, `pedidos/${category}/${orderId}`), { notes: newNotes })
      .then(() => {
        closeNotesPopup();  // Cerrar el popup de notas
      })
      .catch((error) => {
        console.error("Error al guardar las notas:", error);
      });
  } else {
    alert("Por favor, ingrese una nota.");
  }
});

// Cerrar el popup de notas si se hace clic fuera de él
document.getElementById("notesPopup").addEventListener("click", (event) => {
  if (event.target === document.getElementById("notesPopup")) {
    closeNotesPopup();
  }
});

// Función para cerrar el popup de notas
function closeNotesPopup() {
  document.getElementById("notesPopup").style.display = 'none'; // Ocultar el popup
}

// Opcional: Cerrar el popup de notas al presionar Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNotesPopup();
  }
});
