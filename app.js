   // Importar las funciones necesarias de Firebase
   import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
   import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

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
   const database = getDatabase(app);

   // Función para abrir el formulario
   document.getElementById('makeOrderBtn').addEventListener('click', () => {
       document.getElementById('orderForm').style.display = 'flex';
   });

   // Función para cerrar el formulario
   document.querySelector('.form-container .close').addEventListener('click', () => {
       document.getElementById('orderForm').style.display = 'none';
   });

   // Función para agregar el pedido a Firebase
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

       const orderData = {
           client,
           number,
           date,
           time,
           category,
           comanda,
           person,
           notes,
           status: 'Por Revisar'
       };

       // Guarda el pedido en Firebase bajo una nueva clave
       const newOrderRef = ref(database, 'orders/' + Date.now());
       set(newOrderRef, orderData)
           .then(() => {
               console.log("Pedido guardado en Firebase");
               document.getElementById('orderForm').style.display = 'none';
               document.getElementById('orderFormContent').reset();
           })
           .catch((error) => {
               console.error("Error al guardar el pedido: ", error);
           });
   });

   // Mostrar los pedidos en tiempo real
   const ordersRef = ref(database, 'orders/');
   onValue(ordersRef, (snapshot) => {
       const orders = snapshot.val();
       const tableBody = document.getElementById('ordersTableBody');
       tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos datos

       // Iterar sobre los pedidos y agregarlos a la tabla
       for (let orderId in orders) {
           const order = orders[orderId];
           const row = document.createElement('tr');
           row.innerHTML = `
               <td>${order.comanda ? `#${order.comanda}<br>${order.person}` : ''}</td>
               <td>${order.client}<br>${order.number}</td>
               <td>${order.date} ${order.time}</td>
               <td>${order.notes}</td>
               <td>
                   <select class="order-status">
                       <option value="Por Revisar" ${order.status === "Por Revisar" ? 'selected' : ''}>Por Revisar</option>
                       <option value="Revisado" ${order.status === "Revisado" ? 'selected' : ''}>Revisado</option>
                       <option value="Por Aprobar" ${order.status === "Por Aprobar" ? 'selected' : ''}>Por Aprobar</option>
                       <option value="En Proceso" ${order.status === "En Proceso" ? 'selected' : ''}>En Proceso</option>
                       <option value="Entregado" ${order.status === "Entregado" ? 'selected' : ''}>Entregado</option>
                       <option value="No Entregado" ${order.status === "No Entregado" ? 'selected' : ''}>No Entregado</option>
                   </select>
               </td>`;
           row.setAttribute('data-order-id', orderId);
           tableBody.appendChild(row);
       }
   });

   // Actualizar el estado del pedido en Firebase
   document.addEventListener('change', (event) => {
       if (event.target.classList.contains('order-status')) {
           const orderId = event.target.closest('tr').getAttribute('data-order-id');
           const newStatus = event.target.value;

           // Actualizar el estado del pedido en Firebase
           const orderRef = ref(database, 'orders/' + orderId);
           set(orderRef, { status: newStatus })
               .then(() => {
                   console.log("Estado actualizado");
               })
               .catch((error) => {
                   console.error("Error al actualizar el estado: ", error);
               });
       }
   });

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
