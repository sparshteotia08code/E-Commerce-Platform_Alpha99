let shopSortBy = 'default';
let shopFilters = { minPrice:0, maxPrice:200000, brands:[], rating:0 };

function renderShop(){
  let products = getProductsByCategory(store.currentCategory);
  // apply filters
  products = products.filter(p =>
    p.price >= shopFilters.minPrice &&
    p.price <= shopFilters.maxPrice &&
    (shopFilters.brands.length===0 || shopFilters.brands.includes(p.brand)) &&
    p.rating >= shopFilters.rating
  );
  // sort
  if(shopSortBy==='price-asc') products.sort((a,b)=>a.price-b.price);
  else if(shopSortBy==='price-desc') products.sort((a,b)=>b.price-a.price);
  else if(shopSortBy==='rating') products.sort((a,b)=>b.rating-a.rating);
  else if(shopSortBy==='newest') products.sort((a,b)=>b.id-a.id);

  const catLabel = document.getElementById('shopCategoryLabel');
  const countEl  = document.getElementById('shopProductCount');
  const grid     = document.getElementById('shopProductsGrid');
  const breadEl  = document.getElementById('shopBreadcrumb');
  const catNames = {all:'All Products',mens:"Men's Fashion",womens:"Women's Fashion",electronics:'Electronics',accessories:'Accessories',footwear:'Footwear',beauty:'Beauty',home:'Home & Living',sports:'Sports'};
  const catName = catNames[store.currentCategory]||'All Products';
  if(catLabel) catLabel.textContent = catName;
  if(breadEl)  breadEl.textContent = catName;
  if(countEl)  countEl.textContent  = `${products.length} products found`;
  if(!grid) return;
  if(products.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>No products found</h3>
      <p>Try a different category or adjust your filters</p>
      <button class="btn-primary" onclick="filterCategory('all',null);renderShop()">View All Products</button>
    </div>`;
  } else {
    grid.innerHTML = products.map(p => buildProductCard(p)).join('');
  }

  // build sidebar brand filters
  buildSidebarFilters(products);
}

function buildSidebarFilters(products){
  const brandSet = [...new Set(PRODUCTS.filter(p=>store.currentCategory==='all'||p.category===store.currentCategory).map(p=>p.brand))].slice(0,8);
  const container = document.getElementById('brandFilters');
  if(!container) return;
  container.innerHTML = brandSet.map(b=>`
    <label class="filter-opt">
      <input type="checkbox" value="${b}" onchange="toggleBrandFilter('${b}',this.checked)"> ${b}
    </label>`).join('');
}

function toggleBrandFilter(brand, checked){
  if(checked){ if(!shopFilters.brands.includes(brand)) shopFilters.brands.push(brand); }
  else { shopFilters.brands = shopFilters.brands.filter(b=>b!==brand); }
  renderShop();
}

function updatePriceFilter(val){
  shopFilters.maxPrice = Number(val);
  document.getElementById('priceVal').textContent = formatPrice(Number(val));
  renderShop();
}

function updateSort(val){
  shopSortBy = val;
  renderShop();
}
