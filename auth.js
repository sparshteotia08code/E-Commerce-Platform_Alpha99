function renderAuth(){
  const pg = document.getElementById('page-account');
  if(!pg) return;
  pg.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo" onclick="showPage('home')"><span>Adda</span><span>94</span></div>
      <div id="authContent"></div>
    </div>
  </div>`;
  showLogin();
}

function showLogin(){
  document.getElementById('authContent').innerHTML = `
    <div class="auth-title">Welcome back</div>
    <div class="auth-sub">Sign in to your Adda94 account</div>
    <div class="auth-form">
      <div class="form-field"><label>Email or Phone</label><input type="text" id="loginId" placeholder="you@email.com or 9876543210"></div>
      <div class="form-field"><label>Password</label><input type="password" id="loginPass" placeholder="Enter your password"></div>
      <div style="text-align:right;font-size:13px;color:var(--orange);cursor:pointer;margin-top:-4px">Forgot password?</div>
      <button class="btn-full" onclick="doLogin()"><i class="fas fa-right-to-bracket"></i> Sign In</button>
    </div>
    <div class="auth-divider">or sign in with</div>
    <div class="social-auth">
      <button class="social-auth-btn" onclick="socialLogin('Google')">🇬 Google</button>
      <button class="social-auth-btn" onclick="socialLogin('Facebook')">📘 Facebook</button>
    </div>
    <div class="auth-footer">Don't have an account? <a onclick="showSignup()">Sign up free</a></div>`;
}

function showSignup(){
  document.getElementById('authContent').innerHTML = `
    <div class="auth-title">Create account</div>
    <div class="auth-sub">Join 2 million+ shoppers on Adda94</div>
    <div class="auth-form">
      <div class="form-grid2">
        <div class="form-field"><label>First Name</label><input type="text" id="signupFirst" placeholder="Rahul"></div>
        <div class="form-field"><label>Last Name</label><input type="text" id="signupLast" placeholder="Kumar"></div>
      </div>
      <div class="form-field"><label>Email</label><input type="email" id="signupEmail" placeholder="you@email.com"></div>
      <div class="form-field"><label>Phone</label><input type="tel" id="signupPhone" placeholder="9876543210"></div>
      <div class="form-field"><label>Password</label><input type="password" id="signupPass" placeholder="Min. 8 characters"></div>
      <button class="btn-full" onclick="doSignup()"><i class="fas fa-user-plus"></i> Create Account</button>
    </div>
    <div class="auth-divider">or sign up with</div>
    <div class="social-auth">
      <button class="social-auth-btn" onclick="socialLogin('Google')">🇬 Google</button>
      <button class="social-auth-btn" onclick="socialLogin('Facebook')">📘 Facebook</button>
    </div>
    <div class="auth-footer">Already have an account? <a onclick="showLogin()">Sign in</a></div>`;
}

function doLogin(){
  const id = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if(!id||!pass){ showToast('Please fill in all fields','error','fa-xmark'); return; }
  // Simulate login
  const user = { name: id.includes('@') ? id.split('@')[0] : id, email: id, avatar: id[0].toUpperCase() };
  store.user = user; saveUser(user);
  showToast(`Welcome back, ${user.name}! 👋`, 'success', 'fa-user');
  renderProfile();
  updateAccountBtn();
}

function doSignup(){
  const first = document.getElementById('signupFirst').value.trim();
  const last  = document.getElementById('signupLast').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const pass  = document.getElementById('signupPass').value.trim();
  if(!first||!email||!pass){ showToast('Please fill in required fields','error','fa-xmark'); return; }
  if(pass.length < 8){ showToast('Password must be at least 8 characters','error','fa-xmark'); return; }
  const user = { name:`${first} ${last}`.trim(), email, phone, avatar: first[0].toUpperCase() };
  store.user = user; saveUser(user);
  showToast(`Welcome to Adda94, ${first}! 🎉`, 'success', 'fa-star');
  renderProfile();
  updateAccountBtn();
}

function socialLogin(provider){
  const user = { name: provider==='Google'?'Google User':'Facebook User', email:`user@${provider.toLowerCase()}.com`, avatar: provider[0] };
  store.user = user; saveUser(user);
  showToast(`Signed in with ${provider}!`, 'success', 'fa-user');
  renderProfile();
  updateAccountBtn();
}

function updateAccountBtn(){
  const btn = document.getElementById('accountBtn');
  if(btn && store.user) btn.innerHTML = `<i class="fas fa-user"></i><span>${store.user.name.split(' ')[0]}</span>`;
}

function doLogout(){
  store.user = null;
  localStorage.removeItem('adda94_user');
  showToast('Signed out successfully', 'info', 'fa-right-from-bracket');
  const btn = document.getElementById('accountBtn');
  if(btn) btn.innerHTML = `<i class="fas fa-user"></i><span>Login</span>`;
  showPage('home');
}

function renderProfile(){
  const u = store.user;
  const orders = JSON.parse(localStorage.getItem('adda94_orders')||'[]').reverse().slice(0,5);
  const pg = document.getElementById('page-account');
  if(!pg||!u) return;
  pg.innerHTML = `
  <section style="padding:40px 5% 72px">
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:36px;flex-wrap:wrap">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--orange);color:var(--white);font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center">${u.avatar||u.name[0]}</div>
      <div>
        <div style="font-family:var(--font-display);font-size:26px;font-weight:700">${u.name}</div>
        <div style="font-size:14px;color:var(--text3)">${u.email||''}</div>
      </div>
      <button class="btn-secondary" style="margin-left:auto" onclick="doLogout()"><i class="fas fa-right-from-bracket"></i> Sign Out</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:36px">
      <div style="background:var(--white);border-radius:var(--radius-lg);padding:22px;border:1px solid var(--cream3);text-align:center;cursor:pointer" onclick="showPage('cart')">
        <div style="font-size:28px;margin-bottom:8px">🛍️</div>
        <div style="font-size:22px;font-weight:700">${getCartCount()}</div>
        <div style="font-size:13px;color:var(--text3)">Items in Bag</div>
      </div>
      <div style="background:var(--white);border-radius:var(--radius-lg);padding:22px;border:1px solid var(--cream3);text-align:center;cursor:pointer" onclick="showPage('wishlist')">
        <div style="font-size:28px;margin-bottom:8px">❤️</div>
        <div style="font-size:22px;font-weight:700">${store.wishlist.length}</div>
        <div style="font-size:13px;color:var(--text3)">Wishlist Items</div>
      </div>
      <div style="background:var(--white);border-radius:var(--radius-lg);padding:22px;border:1px solid var(--cream3);text-align:center">
        <div style="font-size:28px;margin-bottom:8px">📦</div>
        <div style="font-size:22px;font-weight:700">${orders.length}</div>
        <div style="font-size:13px;color:var(--text3)">Orders Placed</div>
      </div>
    </div>
    <div style="font-family:var(--font-display);font-size:22px;font-weight:700;margin-bottom:20px">Order History</div>
    ${orders.length===0 ? `<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Start shopping to see your orders here</p><button class="btn-primary" onclick="showPage('shop')">Start Shopping</button></div>` :
      orders.map(o=>`
        <div style="background:var(--white);border:1px solid var(--cream3);border-radius:var(--radius-lg);padding:20px;margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
            <div><span style="font-size:12px;color:var(--text3)">Order ID: </span><span style="font-weight:700;color:var(--orange)">${o.id}</span></div>
            <div><span class="status-pill sp-delivered">Delivered</span></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
            ${o.items.slice(0,3).map(i=>{ const p=getProductById(i.id); return p?(p.img?`<img src="${p.img}" style="width:40px;height:48px;object-fit:cover;border-radius:var(--radius-md)" alt="${p.name}"/>`:`<div style="font-size:24px">🛍️</div>`):'' }).join('')}
            ${o.items.length>3?`<div style="font-size:14px;color:var(--text3);align-self:center">+${o.items.length-3} more</div>`:''}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:14px">
            <span style="color:var(--text3)">${new Date(o.placedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
            <span style="font-weight:700;font-size:16px">${formatPrice(o.total)}</span>
          </div>
        </div>`).join('')
    }
  </section>`;
}
