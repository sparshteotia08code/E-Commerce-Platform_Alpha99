let selectedPayment = 'upi';

function renderCheckout(){
  const box = document.getElementById('checkoutOrderItems');
  if(!box) return;
  box.innerHTML = store.cart.map(item=>{
    const p = getProductById(item.id);
    if(!p) return '';
    return `<div class="order-mini-item">
      <div class="order-mini-img" style="overflow:hidden;border-radius:var(--radius-md);background:var(--cream2)">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover"/>` : `<span style="font-size:22px">🛍️</span>`}
      </div>
      <div class="order-mini-name">${p.name}<br><span style="font-size:11px;color:var(--text3)">Size: ${item.size} · Qty: ${item.qty}</span></div>
      <div class="order-mini-price">${formatPrice(p.price*item.qty)}</div>
    </div>`;
  }).join('');

  const subtotal = getCartTotal();
  const delivery = subtotal >= 999 ? 0 : 79;
  const total = subtotal + delivery;
  document.getElementById('ckSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('ckDelivery').textContent = delivery===0?'FREE':formatPrice(delivery);
  document.getElementById('ckTotal').textContent = formatPrice(total);

  selectPayment('upi');
}

function selectPayment(type){
  selectedPayment = type;
  document.querySelectorAll('.payment-opt').forEach(el=>el.classList.remove('selected'));
  document.querySelectorAll('.pm-sub-fields').forEach(el=>el.classList.remove('show'));
  const el = document.getElementById('pm-'+type);
  if(el) el.classList.add('selected');
  const fields = document.getElementById('pm-fields-'+type);
  if(fields) fields.classList.add('show');
  // update radio
  document.querySelectorAll('.payment-opt input[type=radio]').forEach(r=>r.checked=false);
  const radio = document.querySelector(`#pm-${type} input[type=radio]`);
  if(radio) radio.checked = true;
}

function placeOrderNow(){
  // validate address
  const name = document.getElementById('ckName').value.trim();
  const phone = document.getElementById('ckPhone').value.trim();
  const address = document.getElementById('ckAddress').value.trim();
  const city = document.getElementById('ckCity').value.trim();
  const pincode = document.getElementById('ckPincode').value.trim();
  if(!name||!phone||!address||!city||!pincode){
    showToast('Please fill in all delivery details', 'error', 'fa-xmark'); return;
  }
  if(phone.length!==10||isNaN(phone)){
    showToast('Enter a valid 10-digit phone number', 'error', 'fa-xmark'); return;
  }
  if(pincode.length!==6||isNaN(pincode)){
    showToast('Enter a valid 6-digit pincode', 'error', 'fa-xmark'); return;
  }

  // Simulate payment processing
  const btn = document.getElementById('placeOrderBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment…';
  btn.disabled = true;

  setTimeout(()=>{
    const orderId = placeOrder({name,phone,address,city,pincode,payment:selectedPayment});
    showPage('success');
    renderSuccess(orderId);
    btn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
    btn.disabled = false;
  }, 2000);
}

function renderSuccess(orderId){
  const el = document.getElementById('successOrderId');
  if(el) el.textContent = orderId;
}
