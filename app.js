import * as ExcelJS from "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

// Configuración de Firebase
console.log("Inicializando Firebase...");
const firebaseConfig = {
    apiKey: "AIzaSyAvgL0rkaKqXDKrtV15BTdcGglQE57pJsA",
    authDomain: "pedidos-iag.firebaseapp.com",
    databaseURL: "https://pedidos-iag-default-rtdb.firebaseio.com",
    projectId: "pedidos-iag",
    storageBucket: "pedidos-iag.appspot.com",
    messagingSenderId: "775813436384",
    appId: "1:775813436384:web:4dba50e3fed84354e11185"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("Firebase inicializado correctamente.");

try {
    console.log("Inicializando ExcelJS...");
    const workbook = new ExcelJS.Workbook();
    console.log("ExcelJS inicializado correctamente.");
} catch (error) {
    console.error("Error al inicializar ExcelJS:", error);
}

// Mostrar el formulario de agregar pedido
document.getElementById("makeOrderBtn").addEventListener("click", () => {
    console.log("Botón 'Agregar Pedido' presionado.");
    document.getElementById("orderForm").style.display = "block";
});

// Cerrar el formulario
document.querySelector(".close").addEventListener("click", () => {
    console.log("Formulario cerrado.");
    document.getElementById("orderForm").style.display = "none";
    document.getElementById("orderFormContent").reset();
});

// Agregar un nuevo pedido
document.getElementById("orderFormContent").addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Formulario enviado.");

    const client = document.getElementById("client").value;
    const number = document.getElementById("number").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const category = document.getElementById("category").value;
    const comanda = document.getElementById("comanda").value;
    const person = document.getElementById("person").value;
    const notes = document.getElementById("notes").value;
    const status = "Por Revisar";

    console.log("Datos del pedido:", { client, number, date, time, category, comanda, person, notes, status });

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
        console.log("Pedido agregado correctamente.");
        document.getElementById("orderForm").style.display = "none";
        document.getElementById("orderFormContent").reset();
    }).catch(error => console.error("Error al agregar pedido:", error));
});

// Escuchar cambios en Firebase para actualizar la tabla
onValue(ref(db, "pedidos"), (snapshot) => {
    console.log("Escuchando cambios en Firebase...");
    const orders = snapshot.val();
    document.querySelectorAll("table tbody").forEach(tbody => tbody.innerHTML = "");

    if (orders) {
        Object.keys(orders).forEach(category => {
            const categoryOrders = orders[category];
            Object.keys(categoryOrders).forEach(orderId => {
                const order = categoryOrders[orderId];
                console.log("Pedido cargado:", order);
                addOrderToTable(order, orderId, category);
            });
        });
    } else {
        console.log("No hay pedidos disponibles.");
    }
});

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
    row.innerHTML = `
        <td>${comanda ? `#${comanda}<br>${person}` : ""}</td>
        <td>${client}<br>${number}</td>
        <td>${date} ${time}</td>
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

    const notesRow = document.createElement("tr");
    notesRow.innerHTML = `
        <td colspan="3">${notes || "Sin notas"}</td>
        <td><button class="edit-notes">Editar</button></td>
    `;
    tbody.appendChild(notesRow);
}

// Actualizar el estado del pedido
document.addEventListener("change", (event) => {
    if (event.target.classList.contains("order-status")) {
        const orderId = event.target.closest("tr").dataset.id;
        const category = event.target.closest("table").id;
        const newStatus = event.target.value;
        console.log("Actualizando estado:", { orderId, category, newStatus });

        update(ref(db, `pedidos/${category}/${orderId}`), { status: newStatus })
            .then(() => console.log("Estado actualizado correctamente."))
            .catch(error => console.error("Error al actualizar el estado:", error));
    }
});