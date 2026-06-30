function renderWishlist(){
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  const countEl = document.getElementById('wishlistCount');
  if(!grid) return;
  if(store.wishlist.length===0){
    grid.style.display='none';
    empty.style.display='block';
    if(countEl) countEl.textContent='0 items saved';
    return;
  }
  grid.style.display='grid';
  empty.style.display='none';
  if(countEl) countEl.textContent=`${store.wishlist.length} item${store.wishlist.length>1?'s':''} saved`;
  grid.innerHTML = store.wishlist.map(i=>{
    const p = getProductById(i.id);
    return p ? buildProductCard(p) : '';
  }).join('');
}
