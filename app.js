
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

    // Verificar si la categoría es válida
    if (!category) {
        alert("Categoría inválida o no seleccionada.");
        return; // Si la categoría no es válida, no agregamos el pedido.
    }

    // Desactivar el botón para evitar múltiples envíos
    const submitButton = document.getElementById('orderFormContent').querySelector('button');
    submitButton.disabled = true;

    // Agregar el pedido a Firebase
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
        // Agregar el pedido a la tabla solo después de que se haya añadido a Firebase
        addOrderToTable(newOrderRef.key, client, number, date, time, category, comanda, person, notes);
        
        // Reactivar el botón del formulario
        submitButton.disabled = false;

        // Ocultar el formulario y resetearlo
        document.getElementById('orderForm').style.display = 'none';
        document.getElementById('orderFormContent').reset();
    }).catch(error => {
        console.error("Error al agregar el pedido:", error);
        submitButton.disabled = false;
    });
});

// Función para agregar un pedido a la tabla
function addOrderToTable(orderId, client, number, date, time, category, comanda, person, notes) {
    // Comprobar si la categoría existe
    const table = document.getElementById(category);
    if (!table) {
        console.error(`La tabla con el id "${category}" no existe.`);
        return;
    }

    // Crear fila con los detalles del pedido
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${comanda ? '#${comanda}<br>${person}' : ''}</td>
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
        <td><button class="edit-notes" data-order-id="${orderId}">Editar</button></td>
    `;

    // Agregar el pedido a la tabla de la categoría seleccionada
    table.querySelector('tbody').appendChild(row);
    table.querySelector('tbody').appendChild(notesRow);
}

// Actualizar la UI en tiempo real para cambios en los pedidos
onValue(ref(db, 'pedidos'), (snapshot) => {
    if (snapshot.exists()) {
        const pedidos = snapshot.val();
        
        // Limpiar la tabla antes de agregar nuevos pedidos
        const tables = document.querySelectorAll('table');
        tables.forEach(table => table.querySelector('tbody').innerHTML = '');

        // Agregar cada pedido a su tabla correspondiente
        Object.keys(pedidos).forEach(orderId => {
            const order = pedidos[orderId];
            addOrderToTable(orderId, order.client, order.number, order.date, order.time, order.category, order.comanda, order.person, order.notes);
        });
    }
});

// Función para editar notas de un pedido
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-notes')) {
        const orderId = event.target.getAttribute('data-order-id');
        const newNotes = prompt("Edita las notas:");

        if (newNotes !== null) {
            // Actualizar las notas en Firebase
            const orderRef = ref(db, 'pedidos/' + orderId);
            update(orderRef, {
                notes: newNotes
            }).then(() => {
                console.log("Notas actualizadas correctamente.");
            }).catch(error => {
                console.error("Error al actualizar las notas:", error);
            });
        }
    }
});