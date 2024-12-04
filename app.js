
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update   } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";


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

// Inicializar Firebase (debe usar la función 'initializeApp')
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Función para abrir el formulario
document.getElementById('makeOrderBtn').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'flex';
  });
  
  // Función para cerrar el formulario
  document.querySelector('.form-container .close').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'none';
  });
  
  // Manejar el evento de envío del formulario
  document.getElementById('orderFormContent').addEventListener('submit', (event) => {
    event.preventDefault();  // Evita el envío normal del formulario
  
    const submitButton = document.getElementById('makeOrderBtn');
    
    // Deshabilitar el botón para evitar múltiples envíos
    submitButton.disabled = true;
  
    const client = document.getElementById('client').value;
    const number = document.getElementById('number').value;
    const date = new Date(document.getElementById('date').value).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = document.getElementById('time').value;
    const category = document.getElementById('category').value;
    const comanda = document.getElementById('comanda').value;
    const person = document.getElementById('person').value;
    const notes = document.getElementById('notes').value;
  
    // Agregar los datos al Firebase
    const newOrderRef = push(ref(db, 'pedidos'));
    set(newOrderRef, {
      client,
      number,
      date,
      time,
      category,
      comanda,
      person,
      notes,
      status: "Por Revisar"
    }).then(() => {
      // Crear una nueva fila en la tabla después de agregar el pedido
      addOrderToTable(newOrderRef.key, client, number, date, time, category, comanda, person, notes);
  
      // Cerrar el formulario y resetear el contenido
      document.getElementById('orderForm').style.display = 'none';
      document.getElementById('orderFormContent').reset();
      
      // Volver a habilitar el botón de agregar pedido
      submitButton.disabled = false;
    }).catch((error) => {
      console.error("Error al agregar pedido: ", error);
      submitButton.disabled = false;  // Asegurarse de habilitar el botón en caso de error
    });
  });
  
  // Función para agregar un pedido a la tabla
  function addOrderToTable(orderId, client, number, date, time, category, comanda, person, notes) {
    const row = document.createElement('tr');
    row.setAttribute('data-order-id', orderId);
    row.innerHTML = `
      <td>${comanda ? `#${comanda}<br>${person}` : ''}</td>
      <td>${client}<br>${number}</td>
      <td>${date} ${time}</td>
      <td>
        <select class="order-status">
          <option value="Por Revisar">Por Revisar</option>
          <option value="Revisado">Revisado</option>
          <option value="Por Aprobar">Por Aprobar</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Entregado">Entregado</option>
          <option value="No Entregado">No Entregado</option>
        </select>
      </td>
    `;
  
    const notesRow = document.createElement('tr');
    notesRow.classList.add('notes-row');
    notesRow.innerHTML = `
      <td colspan="3">${notes || "Sin notas"}</td>
      <td><button class="edit-notes">Editar</button></td>
    `;
  
    document.getElementById(category).querySelector('tbody').appendChild(row);
    document.getElementById(category).querySelector('tbody').appendChild(notesRow);
  
    // Detectar cambios en el estado del pedido y eliminar filas si corresponde
    row.querySelector('.order-status').addEventListener('change', (e) => {
      const status = e.target.value;
      update(ref(db, `pedidos/${orderId}`), { status }).then(() => {
        if (status === "Entregado" || status === "No Entregado") {
          row.remove();
          notesRow.remove();
        }
      });
    });
  
    // Agregar listener a las notas para editarlas
    notesRow.querySelector('.edit-notes').addEventListener('click', () => {
      const notesCell = notesRow.querySelector('td');
      const currentNotes = notesCell.textContent.trim();
  
      const newNotes = prompt('Editar notas:', currentNotes);
      if (newNotes !== null) {
        notesCell.textContent = newNotes || "Sin notas";
  
        // Actualizar las notas en Firebase en tiempo real
        update(ref(db, `pedidos/${orderId}`), { notes: newNotes || "Sin notas" });
      }
    });
  }
  
  // Cargar los pedidos desde Firebase cuando se cargue la página
  window.onload = () => {
    const ordersRef = ref(db, 'pedidos');
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val();
      if (orders) {
        // Limpiar las tablas antes de cargar los pedidos
        document.querySelectorAll('.table-container tbody').forEach(tbody => tbody.innerHTML = '');
  
        Object.keys(orders).forEach(orderId => {
          const order = orders[orderId];
          addOrderToTable(orderId, order.client, order.number, order.date, order.time, order.category, order.comanda, order.person, order.notes);
        });
      }
    });
  };
  
  // Manejo de la navegación mediante teclado entre tablas y el botón "Agregar Pedido"
  const tables = document.querySelectorAll(".table-container table");
  const addOrderButton = document.getElementById("makeOrderBtn");
  let currentFocusIndex = 0;
  let inTableNavigation = false;
  
  // Configurar tablas y botón para ser enfocados
  tables.forEach(table => table.setAttribute("tabindex", "0"));
  addOrderButton.setAttribute("tabindex", "0");
  
  document.addEventListener("keydown", (e) => {
    if (!inTableNavigation) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveFocus(-1); // Mover entre tablas
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveFocus(1); // Mover entre tablas
      }
      if (e.key === "Enter" && (document.activeElement.tagName === "TABLE" || document.activeElement === addOrderButton)) {
        e.preventDefault();
        if (document.activeElement.tagName === "TABLE") {
          inTableNavigation = true;
          document.activeElement.querySelector("tbody tr:first-child")?.focus(); // Foco al primer elemento de la tabla
        } else {
          addOrderButton.click(); // Hacer click en el botón de "Agregar pedido"
        }
      }
    } else {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateTable(-1); // Moverse hacia arriba en las filas de la tabla
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateTable(1); // Moverse hacia abajo en las filas de la tabla
      }
      if (e.key === "Escape") {
        e.preventDefault();
        inTableNavigation = false;
        tables[currentFocusIndex].blur(); // Salir de la tabla y volver al botón de agregar pedido
      }
    }
  });
  
  // Cambiar el foco entre las tablas y el botón
  function moveFocus(step) {
    currentFocusIndex = (currentFocusIndex + step + tables.length + 1) % (tables.length + 1);
    if (currentFocusIndex === tables.length) {
      addOrderButton.focus(); // Si el índice es el final (el botón), mueve el foco allí
    } else {
      tables[currentFocusIndex].focus(); // Mueve el foco a la tabla seleccionada
    }
  }
  
  // Navegar dentro de la tabla seleccionada
  function navigateTable(direction) {
    const table = document.activeElement.closest("table"); // Obtenemos la tabla activa
    const rows = Array.from(table.querySelectorAll("tbody tr")); // Filas dentro de la tabla
    const currentRow = document.activeElement.closest("tr"); // Fila actual
    const currentIndex = rows.indexOf(currentRow); // Índice de la fila actual
    const nextIndex = currentIndex + direction; // Índice de la siguiente fila (arriba o abajo)
  
    if (nextIndex >= 0 && nextIndex < rows.length) {
      rows[nextIndex].focus(); // Cambiar el foco a la siguiente fila
    }
  }
  
  // Hacer las filas enfocables para facilitar la navegación
  tables.forEach(table => {
    table.querySelectorAll("tbody tr").forEach(row => {
      row.setAttribute("tabindex", "-1"); // Hacer que las filas sean enfocables
    });
  });