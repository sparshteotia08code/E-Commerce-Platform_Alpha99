function renderHome(){
  renderTrending();
  renderNewArrivals();
  startFlashTimer();
}

function renderTrending(){
  const grid = document.getElementById('trendingGrid');
  if(!grid) return;
  grid.innerHTML = getTrending().map(p => buildProductCard(p)).join('');
}

function renderNewArrivals(){
  const grid = document.getElementById('newArrivalsGrid');
  if(!grid) return;
  grid.innerHTML = getNewArrivals().map(p => buildProductCard(p)).join('');
}

// ── FLASH SALE TIMER ──
let timerInterval = null;
function startFlashTimer(){
  if(timerInterval) clearInterval(timerInterval);
  let now = new Date();
  let end = new Date(now);
  end.setHours(23,59,59,0);
  function tick(){
    let diff = Math.max(0, end - new Date());
    let h = Math.floor(diff/3600000);
    let m = Math.floor((diff%3600000)/60000);
    let s = Math.floor((diff%60000)/1000);
    const hEl = document.getElementById('timerH');
    const mEl = document.getElementById('timerM');
    const sEl = document.getElementById('timerS');
    if(hEl) hEl.textContent = String(h).padStart(2,'0');
    if(mEl) mEl.textContent = String(m).padStart(2,'0');
    if(sEl) sEl.textContent = String(s).padStart(2,'0');
  }
  tick();
  timerInterval = setInterval(tick, 1000);
}

function subscribeNewsletter(){
  const input = document.getElementById('newsletterEmail');
  if(!input) return;
  const email = input.value.trim();
  if(!email || !email.includes('@')){ showToast('Please enter a valid email address', 'error', 'fa-xmark'); return; }
  input.value = '';
  showToast('You\'re subscribed! Welcome to Adda94 Club 🎉', 'success', 'fa-envelope');
}

// ── HERO SLIDER ──
let currentSlide = 0;
let slideTimer = null;

function goToSlide(n){
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if(!slides.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
}
function nextSlide(){ goToSlide(currentSlide + 1); resetSlideTimer(); }
function prevSlide(){ goToSlide(currentSlide - 1); resetSlideTimer(); }
function resetSlideTimer(){
  if(slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(nextSlide, 5000);
}
function initHeroSlider(){
  const slides = document.querySelectorAll('.hero-slide');
  if(slides.length) resetSlideTimer();
}
