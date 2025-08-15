const API_URL = 'http://localhost:3000';

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const productForm = document.getElementById('product-form');
const orderForm = document.getElementById('order-form');

const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const productsList = document.getElementById('products-list');
const ordersList = document.getElementById('orders-list');
const reportsOutput = document.getElementById('reports-output');

const sidebarNav = document.getElementById('sidebar-nav');
const authSection = document.getElementById('auth-section');

const productsBtn = document.getElementById('products-btn');
const ordersBtn = document.getElementById('orders-btn');
const reportsBtn = document.getElementById('reports-btn');
const logoutBtn = document.getElementById('logout-btn');

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');

const addProductBtn = document.getElementById('add-product-btn');
const addOrderBtn = document.getElementById('add-order-btn');
const cancelProductBtn = document.getElementById('cancel-product-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');

const productSearch = document.getElementById('product-search');
const productSort = document.getElementById('product-sort');
const orderSearch = document.getElementById('order-search');
const orderStartDate = document.getElementById('order-start-date');
const orderEndDate = document.getElementById('order-end-date');
const filterOrdersBtn = document.getElementById('filter-orders-btn');

const salesReportBtn = document.getElementById('sales-report-btn');
const lowStockReportBtn = document.getElementById('low-stock-report-btn');

const orderProductSelect = document.getElementById('order-product-select');
const orderProductQuantity = document.getElementById('order-product-quantity');
const addProductToOrderBtn = document.getElementById('add-product-to-order-btn');
const orderProductsList = document.getElementById('order-products-list');

let currentEditingProductId = null;
let orderItems = [];

// --- Helper Functions ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function showActiveNavLink(navId) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    if (navId) {
        document.getElementById(navId).classList.add('active');
    }
}

function showAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        sidebarNav.style.display = 'flex';
        authSection.style.display = 'none';
        productsBtn.click();
    } else {
        sidebarNav.style.display = 'none';
        authSection.style.display = 'flex';
        showActiveNavLink(null);
        showSection('auth-section');
    }
}

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// --- Event Listeners for Navigation ---

productsBtn.addEventListener('click', () => {
    showSection('products-section');
    showActiveNavLink('products-btn');
    document.getElementById('product-form-container').style.display = 'none'; // Fix: Hide form
    fetchProducts();
});

ordersBtn.addEventListener('click', () => {
    showSection('orders-section');
    showActiveNavLink('orders-btn');
    document.getElementById('order-form-container').style.display = 'none'; // Fix: Hide form
    fetchOrders();
});

reportsBtn.addEventListener('click', () => {
    showSection('reports-section');
    showActiveNavLink('reports-btn');
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showAuthUI(false);
    showMessage(loginMessage, 'Logged out successfully!', 'success');
});

// --- Auth Form Toggle ---
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.remove('active');
    registerCard.classList.add('active');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerCard.classList.remove('active');
    loginCard.classList.add('active');
});

// --- Authentication ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            showMessage(loginMessage, 'Login successful!', 'success');
            showAuthUI(true);
        } else {
            showMessage(loginMessage, data.message || 'Login failed.', 'error');
        }
    } catch (err) {
        showMessage(loginMessage, 'Network error. Please try again.', 'error');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(registerMessage, 'Registration successful! Please login.', 'success');
            registerForm.reset();
            showLoginLink.click();
        } else {
            showMessage(registerMessage, data.message || 'Registration failed.', 'error');
        }
    } catch (err) {
        showMessage(registerMessage, 'Network error. Please try again.', 'error');
    }
});

// --- Product Management ---

async function fetchProducts() {
    productsList.innerHTML = '<p>Loading products...</p>';
    const searchTerm = productSearch.value;
    const sort = productSort.value;
    let url = `${API_URL}/products`;
    const params = new URLSearchParams();
    if (searchTerm) {
        params.append('search', searchTerm);
    }
    if (sort) {
        params.append('sort', sort);
    }
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    try {
        const res = await fetch(url, { headers: getAuthHeader() });
        const data = await res.json();
        if (res.ok) {
            renderProducts(data);
        } else {
            productsList.innerHTML = `<p class="message error">${data.message || 'Failed to fetch products.'}</p>`;
        }
    } catch (err) {
        productsList.innerHTML = `<p class="message error">Network error. Please log in again.</p>`;
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        productsList.innerHTML = '<p>No products found.</p>';
        return;
    }
    productsList.innerHTML = products.map(product => `
        <div class="data-card">
            <h3>${product.name}</h3>
            <p><strong>ID:</strong> ${product.id}</p>
            <p><strong>Price:</strong> $${product.price}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editProduct('${product.id}', '${product.name}', ${product.price}, ${product.stock}, '${product.category}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('');
}

async function updateOrderStatus(id, status) {
    if (confirm(`Are you sure you want to change order #${id} status to '${status}'?`)) {
        try {
            const res = await fetch(`${API_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({ status: status })
            });

            if (res.ok) {
                fetchOrders(); // Refresh the order list
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update order status.');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        }
    }
}

addProductBtn.addEventListener('click', () => {
    document.getElementById('product-form-container').style.display = 'block';
    document.getElementById('form-title').textContent = 'Add';
    productForm.reset();
    currentEditingProductId = null;
});

cancelProductBtn.addEventListener('click', () => {
    document.getElementById('product-form-container').style.display = 'none';
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const category = document.getElementById('product-category').value;
    const method = currentEditingProductId ? 'PUT' : 'POST';
    const url = currentEditingProductId ? `${API_URL}/products/${currentEditingProductId}` : `${API_URL}/products`;
    const id = parseInt(currentEditingProductId)
    try {
        const res = await fetch(url, {
            method: method,
            headers: getAuthHeader(),
            body:method === 'PUT' ? JSON.stringify({id,name, price, stock, category }) : JSON.stringify({ name, price, stock, category })
        });
        if (res.ok) {
            document.getElementById('product-form-container').style.display = 'none';
            fetchProducts();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to save product.');
        }
    } catch (err) {
        alert('Network error. Please try again.');
    }
});

function editProduct(id, name, price, stock, category) {
    document.getElementById('product-form-container').style.display = 'block';
    document.getElementById('form-title').textContent = 'Edit';
    document.getElementById('product-name').value = name;
    document.getElementById('product-price').value = price;
    document.getElementById('product-stock').value = stock;
    document.getElementById('product-category').value = category;
    currentEditingProductId = id;
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (res.ok) {
            fetchProducts();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to delete product.');
        }
    } catch (err) {
        alert('Network error. Please try again.');
    }
}

productSearch.addEventListener('input', fetchProducts);
productSort.addEventListener('change', fetchProducts);

// --- Order Management ---

async function fetchOrders() {
    ordersList.innerHTML = '<p>Loading orders...</p>';
    const searchTerm = orderSearch.value;
    const startDate = orderStartDate.value;
    const endDate = orderEndDate.value;
    let url = `${API_URL}/orders`;
    const params = new URLSearchParams();
    if (searchTerm) {
        params.append('search', searchTerm);
    }
    if (startDate) {
        params.append('startDate', startDate);
    }
    if (endDate) {
        params.append('endDate', endDate);
    }
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    try {
        const res = await fetch(url, { headers: getAuthHeader() });
        const data = await res.json();
        if (res.ok) {
            renderOrders(data);
        } else {
            ordersList.innerHTML = `<p class="message error">${data.message || 'Failed to fetch orders.'}</p>`;
        }
    } catch (err) {
        ordersList.innerHTML = `<p class="message error">Network error. Please log in again.</p>`;
    }
}

function renderOrders(orders) {
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }
    ordersList.innerHTML = orders.map(order => `
        <div class="data-card">
            <h3>Order #${order.id}</h3>
            <p><strong>Status:</strong> <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            
            <div class="order-items-list">
                <h4>Order Items:</h4>
                ${order.orderItems.map(item => `
                    <div class="order-item-detail">
                        <p><strong>Product:</strong> ${item.product.name}</p>
                        <p><strong>ID:</strong> ${item.product.id}</p>
                        <p><strong>Quantity:</strong> ${item.quantity}</p>
                        <p><strong>Price:</strong> $${item.product.price}</p>
                    </div>
                `).join('')}
            </div>

            ${order.status !== 'shipped' && order.status !== 'canceled' ? `
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="updateOrderStatus('${order.id}', 'shipped')"><i class="fas fa-shipping-fast"></i> Shipped</button>
                <button class="btn btn-danger" onclick="updateOrderStatus('${order.id}', 'canceled')"><i class="fas fa-times"></i> Canceled</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

addOrderBtn.addEventListener('click', () => {
    document.getElementById('order-form-container').style.display = 'block';
    orderForm.reset();
    orderItems = [];
    renderOrderItems();
    fetchProductsForOrderSelect();
});

cancelOrderBtn.addEventListener('click', () => {
    document.getElementById('order-form-container').style.display = 'none';
});

async function fetchProductsForOrderSelect() {
    const select = document.getElementById('order-product-select');
    select.innerHTML = '<option value="">Loading products...</option>';
    try {
        const res = await fetch(`${API_URL}/products`, { headers: getAuthHeader() });
        const products = await res.json();
        if (res.ok) {
            select.innerHTML = '<option value="" disabled selected>Select a product</option>';
            products.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.name} ($${p.price})`;
                option.dataset.price = p.price;
                select.appendChild(option);
            });
        }
    } catch (err) {
        select.innerHTML = '<option value="" disabled>Error loading products</option>';
    }
}

function renderOrderItems() {
    orderProductsList.innerHTML = '';
    let totalOrderPrice = 0;
    if (orderItems.length === 0) {
        orderProductsList.innerHTML = '<p>No products added to this order.</p>';
        return;
    }
    orderItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <span>${item.name} x${item.quantity} - $${(item.quantity * item.price).toFixed(2)}</span>
            <button class="btn-remove" onclick="removeOrderItem(${index})"><i class="fas fa-times-circle"></i></button>
        `;
        orderProductsList.appendChild(itemElement);
        totalOrderPrice += item.quantity * item.price;
    });
}

function addProductToOrder() {
    const selectedOption = orderProductSelect.options[orderProductSelect.selectedIndex];
    const productId = selectedOption.value;
    const productName = selectedOption.textContent.split('(')[0].trim();
    const productPrice = parseFloat(selectedOption.dataset.price);
    const quantity = parseInt(orderProductQuantity.value);

    if (!productId || quantity <= 0) {
        alert('Please select a product and enter a valid quantity.');
        return;
    }

    const existingItemIndex = orderItems.findIndex(item => item.id === productId);
    if (existingItemIndex > -1) {
        orderItems[existingItemIndex].quantity += quantity;
    } else {
        orderItems.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: quantity
        });
    }

    orderProductQuantity.value = '1';
    renderOrderItems();
}
addProductToOrderBtn.addEventListener('click', addProductToOrder);

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    renderOrderItems();
}


orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
        alert('Please add at least one product to the order.');
        return;
    }
    
    const orderDetails = {
        items: orderItems.map(item => ({
            productId: parseInt(item.id),
            quantity: item.quantity,
        }))
    };

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(orderDetails)
        });
        if (res.ok) {
            document.getElementById('order-form-container').style.display = 'none'; // Fix: Close form
            orderItems = [];
            fetchOrders(); // Fix: Refresh order list
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to create order.');
        }
    } catch (err) {
        alert('Network error. Please try again.');
    }
});

filterOrdersBtn.addEventListener('click', fetchOrders);

// --- Reports ---

salesReportBtn.addEventListener('click', async () => {
    const reportTitle = document.getElementById('report-title');
    const reportTableContainer = document.getElementById('report-table-container');

    reportTitle.textContent = 'Sales Report';
    reportTableContainer.innerHTML = '<p>Generating sales report...</p>';

    try {
        const res = await fetch(`${API_URL}/reports/sales`, { headers: getAuthHeader() });
        const data = await res.json();
        
        if (res.ok) {
            // Check for the 'totalSales' property
            if (data && data.totalSales !== undefined) {
                const totalSales = parseFloat(data.totalSales).toFixed(2);
                reportTableContainer.innerHTML = `
                    <div class="report-summary-card">
                        <h3>Total Sales</h3>
                        <p>$${totalSales}</p>
                    </div>
                `;
            } else {
                reportTableContainer.innerHTML = `<p>No sales data found.</p>`;
            }
        } else {
            reportTableContainer.innerHTML = `<p class="message error">${data.message || 'Failed to get sales report.'}</p>`;
        }
    } catch (err) {
        reportTableContainer.innerHTML = `<p class="message error">Network error. Please try again.</p>`;
    }
});

lowStockReportBtn.addEventListener('click', async () => {
    const reportTitle = document.getElementById('report-title');
    const reportTableContainer = document.getElementById('report-table-container');

    reportTitle.textContent = 'Low Stock Report';
    reportTableContainer.innerHTML = '<p>Generating low stock report...</p>';

    try {
        const res = await fetch(`${API_URL}/reports/low-stock`, { headers: getAuthHeader() });
        const data = await res.json();
        
        if (res.ok) {
            if (data.length === 0) {
                reportTableContainer.innerHTML = '<p>No low stock products found.</p>';
                return;
            }

            const tableHtml = `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Current Stock</th>
                            <th>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(product => `
                            <tr>
                                <td>${product.id}</td>
                                <td>${product.name}</td>
                                <td>${product.stock}</td>
                                <td>${product.category}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            reportTableContainer.innerHTML = tableHtml;
        } else {
            reportTableContainer.innerHTML = `<p class="message error">${data.message || 'Failed to get low stock report.'}</p>`;
        }
    } catch (err) {
        reportTableContainer.innerHTML = `<p class="message error">Network error. Please try again.</p>`;
    }
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    showAuthUI(!!token);
    if (!token) {
        loginCard.classList.add('active');
    }
});