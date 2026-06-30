// ── GLOBAL STATE ──
const store = {
  cart: JSON.parse(localStorage.getItem('adda94_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('adda94_wishlist') || '[]'),
  user: (()=>{ try{ return JSON.parse(localStorage.getItem('adda94_user')); }catch(e){ return null; } })(),
  currentProduct: null,
  currentCategory: 'all',
  currentPage: 'home',
};

function saveCart(){ localStorage.setItem('adda94_cart', JSON.stringify(store.cart)); }
function saveWishlist(){ localStorage.setItem('adda94_wishlist', JSON.stringify(store.wishlist)); }
function saveUser(u){ if(u===null){ localStorage.removeItem('adda94_user'); } else { localStorage.setItem('adda94_user', JSON.stringify(u)); } }

// ── CART ──
function addToCart(productId, qty=1, size='M', color=''){
  const p = getProductById(productId);
  if(!p) return;
  const existing = store.cart.find(i => i.id===productId && i.size===size);
  if(existing){ existing.qty = Math.min(existing.qty + qty, 10); }
  else { store.cart.push({id:productId, qty, size, color, addedAt: Date.now()}); }
  saveCart();
  updateCartBadge();
  showToast(`${p.name} added to bag!`, 'success', 'fa-bag-shopping');
}
function removeFromCart(productId, size){
  store.cart = store.cart.filter(i => !(i.id===productId && i.size===size));
  saveCart(); updateCartBadge();
}
function updateCartQty(productId, size, delta){
  const item = store.cart.find(i => i.id===productId && i.size===size);
  if(!item) return;
  item.qty = Math.max(1, Math.min(10, item.qty + delta));
  saveCart();
}
function getCartTotal(){
  return store.cart.reduce((sum, i) => {
    const p = getProductById(i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}
function getCartCount(){
  return store.cart.reduce((sum, i) => sum + i.qty, 0);
}
function updateCartBadge(){
  const count = getCartCount();
  const badge = document.getElementById('cartBadge');
  if(badge){ badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

// ── WISHLIST ──
function toggleWishlist(productId){
  const p = getProductById(productId);
  if(!p) return;
  const idx = store.wishlist.findIndex(i => i.id===productId);
  if(idx > -1){
    store.wishlist.splice(idx,1);
    showToast(`Removed from wishlist`, 'info', 'fa-heart');
  } else {
    store.wishlist.push({id:productId, addedAt:Date.now()});
    showToast(`${p.name} added to wishlist!`, 'success', 'fa-heart');
  }
  saveWishlist();
  updateWishlistBadge();
  return idx === -1; // true = added
}
function isWishlisted(productId){ return store.wishlist.some(i=>i.id===productId); }
function updateWishlistBadge(){
  const count = store.wishlist.length;
  const badge = document.getElementById('wishlistBadge');
  if(badge){ badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

// ── TOAST ──
function showToast(msg, type='info', icon='fa-circle-info'){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icon}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(()=>{ t.style.animation='toastIn 0.3s ease reverse'; setTimeout(()=>t.remove(), 300); }, 3000);
}

// ── PRODUCT CARD BUILDER ──
function buildProductCard(product, showActions=true){
  const disc = getDiscount(product.price, product.originalPrice);
  const wished = isWishlisted(product.id);
  const imgSrc = product.img || '';
  const imgEl = imgSrc
    ? `<img src="${imgSrc}" alt="${product.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
       <div class="emoji-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:64px;background:var(--cream2)">${product.emoji||'🛍️'}</div>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;background:var(--cream2)">${product.emoji||'🛍️'}</div>`;
  return `
  <div class="product-card" onclick="openProduct(${product.id})">
    <div class="product-card-img" style="overflow:hidden;position:relative">
      ${imgEl}
      ${product.badge ? `<div class="product-tag badge-${product.badge}" style="position:absolute;top:12px;left:12px">${product.badge}</div>` : ''}
      <div class="product-quick-actions" style="position:absolute;top:12px;right:12px" onclick="event.stopPropagation()">
        <button class="qa-btn ${wished?'active':''}" onclick="handleWishlist(${product.id},this)" title="Wishlist">
          <i class="fa${wished?'s':'r'} fa-heart"></i>
        </button>
        <button class="qa-btn" onclick="quickAddToCart(${product.id})" title="Add to Bag">
          <i class="fas fa-bag-shopping"></i>
        </button>
      </div>
    </div>
    <div class="product-card-body">
      <div class="product-brand">${product.brand}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-rating">
        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${product.rating%1?'½':''}</span>
        <span class="rating-count">(${product.reviews.toLocaleString('en-IN')})</span>
      </div>
      <div class="product-price">
        <span class="price-now">${formatPrice(product.price)}</span>
        <span class="price-was">${formatPrice(product.originalPrice)}</span>
        <span class="price-off">${disc}% off</span>
      </div>
    </div>
    <div class="product-card-footer">
      <button class="btn-add-cart" onclick="event.stopPropagation();quickAddToCart(${product.id})">
        <i class="fas fa-bag-shopping"></i> Add to Bag
      </button>
    </div>
  </div>`;
}

function handleWishlist(id, btn){
  const added = toggleWishlist(id);
  btn.className = `qa-btn ${added?'active':''}`;
  btn.innerHTML = `<i class="fa${added?'s':'r'} fa-heart"></i>`;
}
function quickAddToCart(id){
  const p = getProductById(id);
  if(!p) return;
  const size = p.sizes[0] || 'M';
  addToCart(id, 1, size);
}

// ── NAVIGATION ──
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+name);
  if(pg){
    pg.classList.add('active');
    store.currentPage = name;
    window.scrollTo({top:0, behavior:'smooth'});
    if(name==='cart') renderCart();
    if(name==='wishlist') renderWishlist();
    if(name==='checkout') renderCheckout();
    if(name==='admin') renderAdmin();
    if(name==='shop') renderShop();
    if(name==='home') renderHome();
    if(name==='account'){
      if(store.user) renderProfile();
      else renderAuth();
      return;
    }
  }
}

function openProduct(id){
  store.currentProduct = getProductById(id);
  if(!store.currentProduct) return;
  renderProductDetail();
  showPage('product');
}

// ── CATEGORY FILTER ──
function filterCategory(cat, el){
  store.currentCategory = cat;
  document.querySelectorAll('.nav-cat-item').forEach(c=>c.classList.remove('active'));
  if(el) el.classList.add('active');
  if(store.currentPage === 'shop') renderShop();
  else showPage('shop');
}

// ── SEARCH ──
function handleSearch(val){
  const dropdown = document.getElementById('searchDropdown');
  if(!val || val.length < 2){ dropdown.classList.remove('show'); return; }
  const results = searchProducts(val).slice(0,6);
  if(!results.length){ dropdown.classList.remove('show'); return; }
  dropdown.innerHTML = results.map(p => `
    <div class="search-result-item" onclick="openProduct(${p.id});document.getElementById('searchDropdown').classList.remove('show');document.getElementById('navSearchInput').value=''">
      <div class="search-result-emoji">${p.emoji}</div>
      <div>
        <div class="search-result-name">${p.name}</div>
        <div class="search-result-price">${formatPrice(p.price)} <span style="text-decoration:line-through;color:#888;font-size:11px">${formatPrice(p.originalPrice)}</span></div>
      </div>
    </div>`).join('');
  dropdown.classList.add('show');
}
document.addEventListener('click', e => {
  if(!e.target.closest('.nav-search')) document.getElementById('searchDropdown')?.classList.remove('show');
});

// ── COUPON ──
const COUPONS = { 'ADDA94':10, 'SAVE20':20, 'WELCOME15':15, 'FIRST50':50 };
function applyCoupon(code){
  const disc = COUPONS[code.toUpperCase()];
  if(disc){ showToast(`Coupon applied! ${disc}% off 🎉`, 'success', 'fa-tag'); return disc; }
  else { showToast('Invalid coupon code', 'error', 'fa-xmark'); return 0; }
}

// ── ORDER ──
function generateOrderId(){
  return 'ADR' + Date.now().toString().slice(-6).toUpperCase() + Math.random().toString(36).slice(-2).toUpperCase();
}
function placeOrder(details){
  const orderId = generateOrderId();
  const order = { id:orderId, items:[...store.cart], total:getCartTotal(), details, placedAt:Date.now() };
  const orders = JSON.parse(localStorage.getItem('adda94_orders')||'[]');
  orders.push(order);
  localStorage.setItem('adda94_orders', JSON.stringify(orders));
  store.cart = []; saveCart(); updateCartBadge();
  return orderId;
}

// ── INIT ──
function initBadges(){
  updateCartBadge();
  updateWishlistBadge();
  if(store.user){
    const btn = document.getElementById('accountBtn');
    if(btn) btn.innerHTML = `<i class="fas fa-user"></i><span>${store.user.name.split(' ')[0]}</span>`;
  }
}
