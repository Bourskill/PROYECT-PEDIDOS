
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

    const order = {
        client,
        number,
        date,
        time,
        category,
        comanda,
        person,
        notes,
        status: "Por Revisar"
    };

    // Guardar en Firebase
    db.ref('pedidos').push(order)
        .then(() => {
            alert('Pedido agregado con éxito');
            // Llamar a la función para actualizar la tabla
            updateOrdersTable();
            document.getElementById('orderForm').style.display = 'none';
            document.getElementById('orderFormContent').reset();
        });
});

// Escuchar cambios en la base de datos
db.ref('pedidos').on('value', (snapshot) => {
    const orders = snapshot.val();
    updateOrdersTable(orders);
});

// Función para actualizar las tablas con los pedidos
function updateOrdersTable(orders) {
    // Limpia las tablas actuales
    const tables = ['dtf', 'terminados', 'redes', 'sellos'];
    tables.forEach(tableId => {
        const table = document.getElementById(tableId).querySelector('tbody');
        table.innerHTML = ''; // Limpia la tabla
    });

    // Añade los pedidos a las tablas correspondientes
    for (const id in orders) {
        const order = orders[id];
        const row = document.createElement('tr');
        row.innerHTML = 
            `<td>${order.comanda ? `#${order.comanda}<br>${order.person}` : ''}</td>
            <td>${order.client}<br>${order.number}</td>
            <td>${order.date} ${order.time}</td>
            <td>
                <select class="order-status" data-id="${id}">
                    <option value="Por Revisar" ${order.status === 'Por Revisar' ? 'selected' : ''}>Por Revisar</option>
                    <option value="Revisado" ${order.status === 'Revisado' ? 'selected' : ''}>Revisado</option>
                    <option value="Por Aprobar" ${order.status === 'Por Aprobar' ? 'selected' : ''}>Por Aprobar</option>
                    <option value="En Proceso" ${order.status === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="Entregado" ${order.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                    <option value="No Entregado" ${order.status === 'No Entregado' ? 'selected' : ''}>No Entregado</option>
                </select>
            </td>`;

        // Agregar el pedido a la tabla correcta
        const table = document.getElementById(order.category).querySelector('tbody');
        table.appendChild(row);

        // Actualizar el estado de los pedidos
        row.querySelector('.order-status').addEventListener('change', (e) => {
            const status = e.target.value;
            db.ref('pedidos').child(id).update({ status });
        });
    }
}

// Funcionalidad de editar notas
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-notes')) {
        const row = event.target.closest('tr');
        const notesCell = row.querySelector('td');
        const currentNotes = notesCell.textContent.trim();

        const newNotes = prompt('Editar notas:', currentNotes);
        if (newNotes !== null) {
            notesCell.textContent = newNotes || "Sin notas";
        }
    }
});

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