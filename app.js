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

// Manejo del formulario para agregar pedidos
document.getElementById("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const client = document.getElementById("clientName").value;
  const number = document.getElementById("clientNumber").value;
  const date = document.getElementById("orderDate").value;
  const time = document.getElementById("orderTime").value;
  const comanda = document.getElementById("comandaNumber").value;
  const person = document.getElementById("responsiblePerson").value;
  const notes = document.getElementById("orderNotes").value;
  const status = "Pendiente"; // Estado inicial del pedido

  const newOrder = { client, number, date, time, comanda, person, notes, status };

  saveOrder(newOrder);
});

// Guardar pedido en Firebase
function saveOrder(order) {
  const category = "pedidos"; // Categoría base
  const newOrderRef = push(ref(db, `${category}`)); // Generar ID único para el pedido

  set(newOrderRef, order)
    .then(() => {
      alert("Pedido agregado exitosamente.");
      document.getElementById("orderForm").reset(); // Limpiar formulario
    })
    .catch((error) => {
      console.error("Error al guardar el pedido:", error);
    });
}

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
  const ordersContainer = document.getElementById("ordersContainer");

  const orderDiv = document.createElement("div");
  orderDiv.className = "order";
  orderDiv.innerHTML = `
    <p><strong>Comanda:</strong> ${comanda || "N/A"}</p>
    <p><strong>Cliente:</strong> ${client} (${number})</p>
    <p><strong>Fecha:</strong> ${formatDate(date, time)}</p>
    <p><strong>Estado:</strong> ${status}</p>
    <button onclick="markAsDelivered('${orderId}')">Marcar como entregado</button>
    <button onclick="deleteOrder('pedidos', '${orderId}')">Eliminar</button>
  `;

  // Agregar notas si existen
  if (notes) {
    orderDiv.innerHTML += `<p><strong>Notas:</strong> ${notes}</p>`;
  }

  ordersContainer.appendChild(orderDiv);
}

// Marcar pedido como entregado
function markAsDelivered(orderId) {
  const orderRef = ref(db, `pedidos/${orderId}`);
  set(orderRef, { status: "Entregado" }, { merge: true })
    .then(() => {
      alert("Pedido marcado como entregado.");
      moveToHistory(orderId); // Mover al historial
    })
    .catch((error) => {
      console.error("Error al actualizar el pedido:", error);
    });
}

// Mover pedido al historial
function moveToHistory(orderId) {
  const orderRef = ref(db, `pedidos/${orderId}`);
  onValue(orderRef, (snapshot) => {
    const orderData = snapshot.val();

    if (orderData) {
      const historyRef = ref(db, `historico/${orderId}`);
      set(historyRef, orderData)
        .then(() => {
          deleteOrder("pedidos", orderId); // Eliminar de pedidos activos
        })
        .catch((error) => {
          console.error("Error al mover al historial:", error);
        });
    }
  });
}

// Eliminar un pedido
function deleteOrder(category, orderId) {
  const orderRef = ref(db, `${category}/${orderId}`);
  remove(orderRef)
    .then(() => {
      console.log("Pedido eliminado correctamente.");
    })
    .catch((error) => {
      console.error("Error al eliminar el pedido:", error);
    });
}

// Formatear fecha y hora
function formatDate(dateString, timeString) {
  const date = new Date(dateString + "T" + timeString);
  const optionsDate = { year: "numeric", month: "long", day: "numeric" };
  const optionsTime = { hour: "numeric", minute: "numeric", hour12: true };

  const formattedDate = date.toLocaleDateString("es-ES", optionsDate);
  const formattedTime = date
    .toLocaleTimeString("es-ES", optionsTime)
    .replace("AM", "a. m.")
    .replace("PM", "p. m.");

  return `${formattedDate} - ${formattedTime}`;
}