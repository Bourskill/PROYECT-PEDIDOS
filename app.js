
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



// Función para mostrar/ocultar el formulario de agregar pedido
document.getElementById('makeOrderBtn').addEventListener('click', () => {
  const form = document.getElementById('orderForm');
  form.style.display = 'block';  // Mostrar el formulario
});

// Función para cerrar el formulario
document.querySelector('.close').addEventListener('click', () => {
  document.getElementById('orderForm').style.display = 'none';  // Ocultar el formulario
});

// Función para agregar un pedido a Firebase
document.getElementById('orderFormContent').addEventListener('submit', (event) => {
  event.preventDefault();

  const client = document.getElementById('client').value;
  const number = document.getElementById('number').value;
  const date = new Date(document.getElementById('date').value).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = document.getElementById('time').value;
  const category = document.getElementById('category').value; // Asegúrate de que este valor sea válido
  const comanda = document.getElementById('comanda').value;
  const person = document.getElementById('person').value;
  const notes = document.getElementById('notes').value;

  // Validar que la categoría exista antes de continuar
  if (!category || !document.getElementById(category)) {
    alert("Por favor, selecciona una categoría válida.");
    return;
  }

  // Crear la referencia para el pedido en Firebase
  const newOrderRef = push(ref(db, 'pedidos'));

  // Agregar el pedido a Firebase
  set(newOrderRef, {
    client,
    number,
    date,
    time,
    category,
    comanda,
    person,
    notes,
    status: 'Por Revisar'
  });

  // Cerrar el formulario y resetear
  document.getElementById('orderForm').style.display = 'none';
  document.getElementById('orderFormContent').reset();
});

// Función para actualizar el estado de un pedido
document.addEventListener('change', (event) => {
  if (event.target.classList.contains('order-status')) {
    const orderId = event.target.closest('tr').dataset.id;
    const newStatus = event.target.value;
    update(ref(db, 'pedidos/' + orderId), { status: newStatus });
  }
});

// Función para editar las notas de un pedido
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('edit-notes')) {
    const row = event.target.closest('tr');
    const notesCell = row.querySelector('td');
    const newNotes = prompt('Editar notas:', notesCell.textContent.trim());
    if (newNotes !== null) {
      notesCell.textContent = newNotes;
      const orderId = row.dataset.id;  // Obtener el ID del pedido
      update(ref(db, 'pedidos/' + orderId), { notes: newNotes });
    }
  }
});

// Función para cargar los pedidos desde Firebase en tiempo real
onValue(ref(db, 'pedidos'), (snapshot) => {
  const orders = snapshot.val();
  if (orders) {
    // Limpiar las tablas antes de llenarlas
    document.querySelectorAll('table tbody').forEach(tbody => tbody.innerHTML = '');

    // Recorrer los pedidos y agregarlos a las tablas
    for (const orderId in orders) {
      const order = orders[orderId];
      const { client, number, date, time, category, comanda, person, notes, status } = order;

      const row = document.createElement('tr');
      row.dataset.id = orderId; // Guardar el ID del pedido en el atributo data-id
      row.innerHTML = `
        <td>${comanda ? `#${comanda}<br>${person}` : ''}</td>
        <td>${client}<br>${number}</td>
        <td>${date} ${time}</td>
        <td>
          <select class="order-status" value="${status}">
            <option value="Por Revisar">Por Revisar</option>
            <option value="Revisado">Revisado</option>
            <option value="Por Aprobar">Por Aprobar</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Entregado">Entregado</option>
            <option value="No Entregado">No Entregado</option>
          </select>
        </td>
      `;

      // Crear la fila para las notas
      const notesRow = document.createElement('tr');
      notesRow.classList.add('notes-row');
      notesRow.innerHTML = `
        <td colspan="3">${notes || "Sin notas"}</td>
        <td><button class="edit-notes">Editar</button></td>
      `;

      // Añadir las filas a la tabla correspondiente según la categoría seleccionada
      const table = document.getElementById(category);
      if (table) {
        table.querySelector('tbody').appendChild(row);
        table.querySelector('tbody').appendChild(notesRow);
      }
    }
  }
});