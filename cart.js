let appliedCoupon = 0;

function renderCart(){
  const list = document.getElementById('cartItemsList');
  const empty = document.getElementById('cartEmpty');
  const layout = document.getElementById('cartLayout');
  if(!list) return;

  if(store.cart.length === 0){
    empty.style.display = 'block';
    layout.style.display = 'none';
    document.getElementById('cartSubtitle').textContent = '0 items in your bag';
    return;
  }
  empty.style.display = 'none';
  layout.style.display = 'grid';
  document.getElementById('cartSubtitle').textContent = `${getCartCount()} item${getCartCount()>1?'s':''} in your bag`;

  list.innerHTML = store.cart.map(item => {
    const p = getProductById(item.id);
    if(!p) return '';
    return `
    <div class="cart-item" id="cartItem-${p.id}-${item.size}">
      <div class="cart-item-img" style="overflow:hidden;border-radius:var(--radius-md);background:var(--cream2)">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';this.style.display='none'"/>` : `<span style="font-size:44px">🛍️</span>`}
      </div>
      <div class="cart-item-details">
        <div class="cart-item-brand">${p.brand}</div>
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-meta">Size: ${item.size} ${item.color?`· Color: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${item.color};vertical-align:middle"></span>`:''}  </div>
        <div class="cart-item-price">${formatPrice(p.price * item.qty)} ${item.qty>1?`<span style="font-size:13px;color:var(--text3);font-weight:400">(${formatPrice(p.price)} each)</span>`:''}</div>
        <div class="cart-item-actions">
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="changeItemQty(${p.id},'${item.size}',-1)">−</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" onclick="changeItemQty(${p.id},'${item.size}',1)">+</button>
          </div>
          <span class="cart-remove" onclick="removeCartItem(${p.id},'${item.size}')"><i class="fas fa-trash-can"></i> Remove</span>
        </div>
      </div>
    </div>`;
  }).join('');

  updateCartSummary();
}

function changeItemQty(id, size, delta){
  updateCartQty(id, size, delta);
  renderCart();
}
function removeCartItem(id, size){
  removeFromCart(id, size);
  renderCart();
  showToast('Item removed from bag', 'info', 'fa-trash-can');
}

function updateCartSummary(){
  const subtotal = getCartTotal();
  const delivery = subtotal >= 999 ? 0 : 79;
  const discount = Math.round(subtotal * appliedCoupon / 100);
  const total = subtotal - discount + delivery;

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryDelivery').textContent = delivery === 0 ? 'FREE' : formatPrice(delivery);
  document.getElementById('summaryDiscount').textContent = discount > 0 ? `-${formatPrice(discount)}` : '—';
  document.getElementById('summaryTotal').textContent = formatPrice(total);

  const savingsEl = document.getElementById('summarySavings');
  const totalSaved = store.cart.reduce((s,item)=>{
    const p = getProductById(item.id);
    if(!p) return s;
    return s + (p.originalPrice - p.price) * item.qty;
  },0);
  savingsEl.innerHTML = `<i class="fas fa-tag"></i> You're saving ${formatPrice(totalSaved + discount)} on this order!`;
}

function handleCoupon(){
  const input = document.getElementById('couponInput');
  const disc = applyCoupon(input.value);
  if(disc){ appliedCoupon = disc; updateCartSummary(); }
}

function goToCheckout(){
  if(store.cart.length===0){ showToast('Your bag is empty!','error','fa-xmark'); return; }
  showPage('checkout');
}
