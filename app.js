
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
const db = getDatabase(app); // Obtener referencia a la base de datos
// Función para abrir el formulario
document.getElementById('makeOrderBtn').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'flex';
});

// Función para cerrar el formulario
document.querySelector('.form-container .close').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'none';
});

// Función para agregar el pedido a la base de datos
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

    const order = {
        client,
        number,
        date,
        time,
        category,
        comanda,
        person,
        notes,
        status: 'Por Revisar'  // Estado inicial
    };

    // Guardar el pedido en Firebase
    const newOrderRef = db.ref('pedidos').push();
    newOrderRef.set(order);

    // Limpiar el formulario y cerrar
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('orderFormContent').reset();
});

// Leer los pedidos desde Firebase y actualizar la tabla
db.ref('pedidos').on('value', (snapshot) => {
    const orders = snapshot.val();
    updateOrdersTable(orders);
});

// Función para actualizar la tabla con los pedidos de Firebase
function updateOrdersTable(orders) {
    const tables = document.querySelectorAll(".table-container table");
    // Limpiar las tablas antes de actualizar
    tables.forEach(table => {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
    });

    // Recorrer los pedidos y agregarlos a las tablas correspondientes
    for (const orderId in orders) {
        const order = orders[orderId];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.comanda ? `#${order.comanda}<br>${order.person}` : ''}</td>
            <td>${order.client}<br>${order.number}</td>
            <td>${order.date} ${order.time}</td>
            <td>
                <select class="order-status" data-order-id="${orderId}">
                    <option value="Por Revisar" ${order.status === "Por Revisar" ? "selected" : ""}>Por Revisar</option>
                    <option value="Revisado" ${order.status === "Revisado" ? "selected" : ""}>Revisado</option>
                    <option value="Por Aprobar" ${order.status === "Por Aprobar" ? "selected" : ""}>Por Aprobar</option>
                    <option value="En Proceso" ${order.status === "En Proceso" ? "selected" : ""}>En Proceso</option>
                    <option value="Entregado" ${order.status === "Entregado" ? "selected" : ""}>Entregado</option>
                    <option value="No Entregado" ${order.status === "No Entregado" ? "selected" : ""}>No Entregado</option>
                </select>
            </td>`;

        const notesRow = document.createElement('tr');
        notesRow.classList.add('notes-row');
        notesRow.innerHTML = `
            <td colspan="3">${order.notes || "Sin notas"}</td>
            <td><button class="edit-notes" data-order-id="${orderId}">Editar</button></td>`;

        // Agregar las filas a la tabla correspondiente
        document.getElementById(order.category).querySelector('tbody').appendChild(row);
        document.getElementById(order.category).querySelector('tbody').appendChild(notesRow);
    }

    // Detectar cambios en el estado del pedido y actualizar Firebase
    document.querySelectorAll('.order-status').forEach(statusSelect => {
        statusSelect.addEventListener('change', (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            const newStatus = e.target.value;

            // Actualizar el estado del pedido en Firebase
            db.ref(`pedidos/${orderId}`).update({ status: newStatus });

            // Eliminar fila si el pedido está "Entregado" o "No Entregado"
            if (newStatus === "Entregado" || newStatus === "No Entregado") {
                const row = e.target.closest('tr');
                const notesRow = row.nextElementSibling;
                row.remove();
                notesRow.remove();
            }
        });
    });

    // Funcionalidad de editar notas
    document.querySelectorAll('.edit-notes').forEach(button => {
        button.addEventListener('click', (event) => {
            const orderId = event.target.getAttribute('data-order-id');
            const newNotes = prompt('Editar notas:');
            if (newNotes !== null) {
                // Actualizar las notas en Firebase
                db.ref(`pedidos/${orderId}`).update({ notes: newNotes });

                // Actualizar la UI con las nuevas notas
                const notesCell = event.target.closest('tr').querySelector('td');
                notesCell.textContent = newNotes || "Sin notas";
            }
        });
    });
});

// Función para abrir y cerrar el formulario
document.getElementById('makeOrderBtn').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'flex';
});

document.querySelector('.form-container .close').addEventListener('click', () => {
    document.getElementById('orderForm').style.display = 'none';
});

// Manejo de la navegación mediante teclado entre tablas y el botón "Agregar Pedido"
const tables = document.querySelectorAll(".table-container table");
const addOrderButton = document.getElementById("makeOrderBtn");
let currentFocusIndex = 0;
let inTableNavigation = false;

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
                document.activeElement.querySelector("tbody tr:first-child")?.focus();
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
    const table = document.activeElement.closest("table");
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const currentRow = document.activeElement.closest("tr");
    const currentIndex = rows.indexOf(currentRow);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < rows.length) {
        rows[nextIndex].focus();
    }
}

// Hacer las filas enfocables para facilitar la navegación
tables.forEach(table => {
    table.querySelectorAll("tbody tr").forEach(row => {
        row.setAttribute("tabindex", "-1");
    });
});