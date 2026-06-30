function renderAdmin(){
  renderAdminStats();
  renderAdminOrders();
  renderAdminTopProducts();
  renderAdminChart();
  renderAdminProducts();
  switchAdminTab('overview');
}

function renderAdminStats(){
  const orders = JSON.parse(localStorage.getItem('adda94_orders')||'[]');
  const totalRev = orders.reduce((s,o)=>s+o.total,0);
  document.getElementById('statRevenue').textContent = formatPrice(totalRev||2847500);
  document.getElementById('statOrders').textContent  = (orders.length||1247).toLocaleString('en-IN');
  document.getElementById('statCustomers').textContent = '8,432';
  document.getElementById('statProducts').textContent = PRODUCTS.length;
}

function renderAdminOrders(){
  const orders = JSON.parse(localStorage.getItem('adda94_orders')||'[]').reverse();
  const statuses = ['sp-delivered','sp-shipped','sp-processing','sp-pending'];
  const statusNames = ['Delivered','Shipped','Processing','Pending'];
  const tbody = document.getElementById('ordersTableBody');
  if(!tbody) return;
  const sampleOrders = [
    {id:'ADR94001234',customer:'Priya Sharma',items:3,total:4299,status:0},
    {id:'ADR94005678',customer:'Rahul Verma',items:1,total:24999,status:1},
    {id:'ADR94009012',customer:'Anita Singh',items:2,total:6798,status:2},
    {id:'ADR94003456',customer:'Vikram Nair',items:4,total:11596,status:3},
    {id:'ADR94007890',customer:'Sneha Bose',items:1,total:2999,status:0},
  ];
  const allOrders = [...orders.map((o,i)=>({id:o.id,customer:store.user?.name||'Customer',items:o.items.length,total:o.total,status:0})), ...sampleOrders];
  tbody.innerHTML = allOrders.slice(0,8).map(o=>`
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.items} item${o.items>1?'s':''}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-pill ${statuses[o.status]}">${statusNames[o.status]}</span></td>
    </tr>`).join('');
}

function renderAdminTopProducts(){
  const list = document.getElementById('topProductsList');
  if(!list) return;
  const top = [...PRODUCTS].sort((a,b)=>b.reviews-a.reviews).slice(0,5);
  list.innerHTML = top.map(p=>`
    <div class="top-product-row">
      <div class="top-product-img" style="overflow:hidden;border-radius:var(--radius-md)">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>` : '🛍️'}
      </div>
      <div class="top-product-name">${p.name}</div>
      <div class="top-product-rev">${formatPrice(p.price * Math.floor(p.reviews/10))}</div>
    </div>`).join('');
}

function renderAdminChart(){
  const chart = document.getElementById('salesChart');
  if(!chart) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const vals = [65,78,55,90,72,88];
  const max = Math.max(...vals);
  chart.innerHTML = months.map((m,i)=>`
    <div class="chart-bar-row">
      <div class="chart-bar-lbl">${m}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${vals[i]/max*100}%"></div></div>
      <div class="chart-bar-val">₹${vals[i]}K</div>
    </div>`).join('');
}

function renderAdminProducts(){
  const titleEl = document.getElementById('adminProductsTitle');
  if(titleEl) titleEl.textContent = `All Products (${PRODUCTS.length})`;
  const grid = document.getElementById('adminProductsGrid');
  if(!grid) return;
  grid.innerHTML = PRODUCTS.slice(0,8).map(p=>`
    <div class="admin-product-card">
      <div class="admin-product-img" style="overflow:hidden;padding:0;height:160px">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>` : '<div style=\"display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;background:var(--cream2)\">🛍️</div>'}
      </div>
      <div class="admin-product-body">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-price">${formatPrice(p.price)}</div>
        <div class="admin-product-actions">
          <button class="admin-btn-sm admin-btn-edit" onclick="showToast('Edit feature coming soon','info','fa-pen')"><i class="fas fa-pen"></i> Edit</button>
          <button class="admin-btn-sm admin-btn-del"  onclick="showToast('Delete feature coming soon','info','fa-trash')"><i class="fas fa-trash"></i> Del</button>
        </div>
      </div>
    </div>`).join('');
}

function switchAdminTab(tab){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('adminTab-'+tab).classList.add('active');
  document.getElementById('adminPanel-'+tab).classList.add('active');
}
