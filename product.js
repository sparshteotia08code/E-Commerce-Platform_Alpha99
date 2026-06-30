let pdQty = 1;
let pdSize = '';
let pdColor = '';
let pdTab = 'description';

function renderProductDetail(){
  const p = store.currentProduct;
  if(!p) return;
  pdQty = 1; pdSize = p.sizes[0]||''; pdColor = p.colors[0]||'';

  const disc = getDiscount(p.price, p.originalPrice);

  document.getElementById('pdBreadcrumbCat').textContent = ({mens:"Men's",womens:"Women's",electronics:'Electronics',accessories:'Accessories',footwear:'Footwear',beauty:'Beauty',home:'Home',sports:'Sports'}[p.category]||p.category);
  document.getElementById('pdBreadcrumbName').textContent = p.name;
  // Set main product image
  const mainImgEl = document.getElementById('pdMainEmoji');
  if(p.img){
    mainImgEl.innerHTML = '';
    mainImgEl.style.cssText = 'font-size:0;padding:0;background:var(--cream2);border-radius:var(--radius-xl);overflow:hidden';
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.name;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s ease';
    img.onmouseover = ()=>img.style.transform='scale(1.04)';
    img.onmouseout  = ()=>img.style.transform='scale(1)';
    img.onerror = ()=>{ mainImgEl.innerHTML = p.emoji||'🛍️'; mainImgEl.style.fontSize='130px'; mainImgEl.style.padding=''; };
    mainImgEl.appendChild(img);
  } else {
    mainImgEl.innerHTML = p.emoji||'🛍️';
    mainImgEl.style.fontSize = '130px';
  }
  document.getElementById('pdBrand').textContent = p.brand;
  document.getElementById('pdName').textContent = p.name;
  document.getElementById('pdRatingNum').textContent = p.rating.toFixed(1);
  document.getElementById('pdStars').textContent = '★'.repeat(Math.floor(p.rating))+(p.rating%1?'½':'');
  document.getElementById('pdReviewCount').textContent = `${p.reviews.toLocaleString('en-IN')} reviews`;
  document.getElementById('pdPrice').textContent = formatPrice(p.price);
  document.getElementById('pdPriceOld').textContent = formatPrice(p.originalPrice);
  document.getElementById('pdSavings').textContent = `You save ${formatPrice(p.originalPrice - p.price)} (${disc}% off)`;

  // Thumbs
  const thumbs = document.getElementById('pdThumbs');
  const thumbImgs = p.img ? [p.img, p.img+'&sat=-100', p.img+'&blur=1', p.img+'&bri=20'] : [];
  if(thumbImgs.length){
    thumbs.innerHTML = thumbImgs.map((url,i)=>`
      <div class="pd-thumb ${i===0?'active':''}" onclick="selectThumbImg(this,'${url}')" style="overflow:hidden">
        <img src="${url}" alt="view ${i+1}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='${(p.emoji||'🛍️')}';this.parentElement.style.fontSize='28px';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center'"/>
      </div>`).join('');
  } else {
    const emojis = [p.emoji||'🛍️','📦','🏷️','✨'];
    thumbs.innerHTML = emojis.map((e,i)=>`<div class="pd-thumb ${i===0?'active':''}" onclick="selectThumb(this,'${e}')">${e}</div>`).join('');
  }

  // Sizes
  const sizesEl = document.getElementById('pdSizes');
  sizesEl.innerHTML = p.sizes.map((s,i)=>`<button class="size-btn ${i===0?'active':''}" onclick="selectSize(this,'${s}')">${s}</button>`).join('');

  // Colors
  const colorsEl = document.getElementById('pdColors');
  colorsEl.innerHTML = p.colors.map((c,i)=>`<div class="color-swatch ${i===0?'active':''}" style="background:${c}" onclick="selectColor(this,'${c}')" title="${c}"></div>`).join('');

  // Qty
  document.getElementById('pdQtyVal').textContent = pdQty;

  // Wishlist btn
  const wBtn = document.getElementById('pdWishBtn');
  const wished = isWishlisted(p.id);
  wBtn.className = `btn-wish ${wished?'active':''}`;
  wBtn.innerHTML = `<i class="fa${wished?'s':'r'} fa-heart"></i>`;

  // Description tab
  document.getElementById('pdDescriptionContent').innerHTML = `
    <p style="margin-bottom:16px">${p.description}</p>
    <h4 style="margin-bottom:12px;font-size:14px;font-weight:700;">Product Features</h4>
    <ul style="padding-left:20px;display:flex;flex-direction:column;gap:6px;">
      ${p.features.map(f=>`<li style="font-size:14px;color:var(--text2)">${f}</li>`).join('')}
    </ul>`;

  // Reviews tab
  const reviews = [
    {user:'Rahul K.',rating:5,date:'12 Apr 2026',text:'Absolutely love this product! Quality is amazing and delivery was super fast. Exactly as described.'},
    {user:'Priya M.',rating:4,date:'8 Apr 2026',text:'Good quality for the price. Looks exactly like the photo. Would buy again.'},
    {user:'Ankit S.',rating:5,date:'2 Apr 2026',text:'Fantastic! Premium feel and great value for money. Highly recommend to everyone.'},
    {user:'Sneha R.',rating:4,date:'28 Mar 2026',text:'Very happy with this purchase. Fast delivery, nice packaging and great product quality.'},
  ];
  document.getElementById('pdReviewsContent').innerHTML = reviews.map(r=>`
    <div class="review-card">
      <div class="review-top">
        <span class="review-user">${r.user}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <div class="stars" style="font-size:13px;margin-bottom:8px">${'★'.repeat(r.rating)}</div>
      <div class="review-text">${r.text}</div>
    </div>`).join('');

  // Similar products
  const similar = PRODUCTS.filter(pr=>pr.category===p.category && pr.id!==p.id).slice(0,4);
  document.getElementById('pdSimilarGrid').innerHTML = similar.map(pr=>buildProductCard(pr)).join('');

  // Features tab
  const featEl = document.getElementById('pdDescriptionContent2');
  if(featEl){
    featEl.innerHTML = `
      <h4 style="margin-bottom:16px;font-size:15px;font-weight:700;">Product Features</h4>
      <ul style="padding-left:20px;display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">
        ${p.features.map(f=>`<li style="font-size:14px;color:var(--text2);line-height:1.6">${f}</li>`).join('')}
      </ul>
      <h4 style="margin-bottom:12px;font-size:15px;font-weight:700;">Product Details</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:var(--cream2);border-radius:var(--radius-md);padding:12px 16px;font-size:13px"><span style="color:var(--text3)">Brand</span><br/><strong>${p.brand}</strong></div>
        <div style="background:var(--cream2);border-radius:var(--radius-md);padding:12px 16px;font-size:13px"><span style="color:var(--text3)">Category</span><br/><strong>${p.category.charAt(0).toUpperCase()+p.category.slice(1)}</strong></div>
        <div style="background:var(--cream2);border-radius:var(--radius-md);padding:12px 16px;font-size:13px"><span style="color:var(--text3)">Rating</span><br/><strong>${p.rating} ★ (${p.reviews.toLocaleString('en-IN')} reviews)</strong></div>
        <div style="background:var(--cream2);border-radius:var(--radius-md);padding:12px 16px;font-size:13px"><span style="color:var(--text3)">Availability</span><br/><strong style="color:var(--green)">In Stock</strong></div>
      </div>`;
  }

  // Badge
  const badgeEl = document.getElementById('pdBadge');
  if(p.badge){ badgeEl.className=`pd-tag badge-${p.badge}`; badgeEl.textContent=p.badge; badgeEl.style.display='inline-block'; }
  else badgeEl.style.display='none';

  // Reset tab
  selectPdTab('description');
}

function selectThumbImg(el, url){
  document.querySelectorAll('.pd-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const main = document.getElementById('pdMainEmoji');
  main.innerHTML = '';
  main.style.fontSize = '0';
  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--radius-xl)';
  main.appendChild(img);
}
function selectThumb(el, emoji){
  document.querySelectorAll('.pd-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pdMainEmoji').textContent = emoji;
}
function selectSize(el, size){
  document.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  pdSize = size;
}
function selectColor(el, color){
  document.querySelectorAll('.color-swatch').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  pdColor = color;
}
function changeQty(delta){
  pdQty = Math.max(1, Math.min(10, pdQty + delta));
  document.getElementById('pdQtyVal').textContent = pdQty;
}
function pdAddToCart(){
  if(!pdSize){ showToast('Please select a size', 'error', 'fa-xmark'); return; }
  addToCart(store.currentProduct.id, pdQty, pdSize, pdColor);
}
function pdToggleWishlist(){
  const btn = document.getElementById('pdWishBtn');
  const added = toggleWishlist(store.currentProduct.id);
  btn.className = `btn-wish ${added?'active':''}`;
  btn.innerHTML = `<i class="fa${added?'s':'r'} fa-heart"></i>`;
}
function checkPincode(){
  const val = document.getElementById('pincodeInput').value.trim();
  if(val.length !== 6 || isNaN(val)){ showToast('Enter a valid 6-digit pincode', 'error', 'fa-xmark'); return; }
  const days = Math.floor(Math.random()*3)+2;
  showToast(`Delivery available! Estimated ${days}-${days+1} business days`, 'success', 'fa-truck');
}
function selectPdTab(tab){
  pdTab = tab;
  document.querySelectorAll('.pd-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.pd-tab-panel').forEach(p=>p.classList.add('hidden'));
  document.getElementById('pdTab-'+tab).classList.add('active');
  document.getElementById('pdPanel-'+tab).classList.remove('hidden');
}
