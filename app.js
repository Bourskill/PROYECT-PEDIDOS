
// Importar Firebase y los servicios que necesitamos
// Importar Firebase y los servicios que necesitamos
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js'; // Versión específica
import { getDatabase, ref, set, get, child } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js'; // Versión específica


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
// Función para abrir el formulario
document.getElementById('makeOrderBtn').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'flex';
});

// Función para cerrar el formulario
document.querySelector('.form-container .close').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'none';
});

// Función para agregar el pedido a la tabla
document.getElementById('orderFormContent').addEventListener('submit', (event) => {
    event.preventDefault();

    const client = document.getElementById('client').value;
    const number = document.getElementById('number').value;
    const date = new Date(document.getElementById('date').value).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = document.getElementById('time').value;
    const category = document.getElementById('category').value;
    const comanda = document.getElementById('comanda').value;
    const person = document.getElementById('person').value;
    const notes = document.getElementById('notes').value;

    // Referencia a la base de datos de Firebase
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
        status: "Por Revisar"
    });

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${comanda ? `#${comanda}<br>${person}` : ''}</td>
        <td>${client}<br>${number}</td>
        <td>${date} ${time}</td>
        <td>
            <select class="order-status" data-order-id="${newOrderRef.key}">
                <option value="Por Revisar">Por Revisar</option>
                <option value="Revisado">Revisado</option>
                <option value="Por Aprobar">Por Aprobar</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Entregado">Entregado</option>
                <option value="No Entregado">No Entregado</option>
            </select>
        </td>`;

    const notesRow = document.createElement('tr');
    notesRow.classList.add('notes-row');
    notesRow.innerHTML = `
        <td colspan="3">${notes || "Sin notas"}</td>
        <td><button class="edit-notes" data-order-id="${newOrderRef.key}">Editar</button></td>`;

    document.getElementById(category).querySelector('tbody').appendChild(row);
    document.getElementById(category).querySelector('tbody').appendChild(notesRow);

    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('orderFormContent').reset();

    // Detectar cambios en el estado del pedido y actualizar en Firebase
    row.querySelector('.order-status').addEventListener('change', (e) => {
        const orderId = e.target.getAttribute('data-order-id');
        const newStatus = e.target.value;

        // Actualizar el estado del pedido en Firebase
        update(ref(db, `pedidos/${orderId}`), { status: newStatus });

        // Eliminar la fila si el pedido está entregado o no entregado
        if (newStatus === "Entregado" || newStatus === "No Entregado") {
            row.remove();
            notesRow.remove();
        }
    });
});

// Funcionalidad de editar notas
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-notes')) {
        const orderId = event.target.getAttribute('data-order-id');
        const newNotes = prompt('Editar notas:');

        if (newNotes !== null) {
            // Actualizar las notas en Firebase
            update(ref(db, `pedidos/${orderId}`), { notes: newNotes });

            // Actualizar la UI con las nuevas notas
            const row = event.target.closest('tr');
            const notesCell = row.querySelector('td');
            notesCell.textContent = newNotes || "Sin notas";
        }
    }
});