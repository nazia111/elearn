(function(window, document, $){
  if(!$) return;

  const USER_KEY = 'ENRICH_USER';
  function getUser(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch(e){ return null; } }
  function setUser(user){ localStorage.setItem(USER_KEY, JSON.stringify(user)); }
  function clearUser(){ localStorage.removeItem(USER_KEY); }
  function getEnrolments(){ const u=getUser(); if(!u) return []; try{ return JSON.parse(localStorage.getItem('ENRICH_ENROLLED_'+u.username)||'[]'); }catch(e){ return []; } }
  function saveEnrolments(list){ const u=getUser(); if(!u) return; localStorage.setItem('ENRICH_ENROLLED_'+u.username, JSON.stringify(list)); }
  function addEnrolments(courses){ const u=getUser(); if(!u) return; const cur=getEnrolments(); const ids=new Set(cur.map(c=>c.id)); courses.forEach(c=>{ if(!ids.has(c.id)) cur.push(c); }); saveEnrolments(cur); }

  function cartKey(){ const u = getUser(); return u ? `ENRICH_CART_${u.username}` : 'ENRICH_CART_GUEST'; }
  function getCart(){ const key = cartKey(); try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } }
  function saveCart(items){ const key = cartKey(); localStorage.setItem(key, JSON.stringify(items)); }
  function addToCart(item){ const items = getCart(); if(items.find(i=>i.id===item.id)){ alert('This course is already in your cart.'); return; } items.push(item); saveCart(items); updateCartCount(); }
  function removeFromCart(id){ const items = getCart().filter(i=>i.id!==id); saveCart(items); updateCartCount(); }
  function clearCart(){ saveCart([]); updateCartCount(); }

  function updateCartCount(){
    const count = getCart().length;
    let badge = document.getElementById('cart-count');
    if(!badge){
      const link = document.querySelector('a[title="Cart"]');
      if(link){
        badge = document.createElement('span');
        badge.id = 'cart-count';
        badge.style.marginLeft = '6px';
        badge.style.background = '#f5a425';
        badge.style.color = '#fff';
        badge.style.width = '18px';
        badge.style.height = '18px';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.borderRadius = '50%';
        badge.style.fontSize = '12px';
        link.appendChild(badge);
      }
    }
    if(badge){ badge.textContent = count>0 ? String(count) : ''; badge.style.display = count>0 ? 'inline-flex' : 'none'; }
  }

  function ensureLogoAndCoursesDropdown(){
    const header = document.querySelector('header.main-header');
    if(!header) return;
    const logo = header.querySelector('.logo');
    if(logo && !logo.querySelector('svg')){
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width','36'); svg.setAttribute('height','36'); svg.setAttribute('viewBox','0 0 64 64'); svg.classList.add('header-logo'); svg.style.marginRight='10px'; svg.style.verticalAlign='middle';
      const circle = document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx','32'); circle.setAttribute('cy','32'); circle.setAttribute('r','28'); circle.setAttribute('stroke','#f5a425'); circle.setAttribute('stroke-width','4'); circle.setAttribute('fill','none');
      const text = document.createElementNS('http://www.w3.org/2000/svg','text'); text.setAttribute('x','32'); text.setAttribute('y','38'); text.setAttribute('text-anchor','middle'); text.setAttribute('font-size','28'); text.setAttribute('font-family','Montserrat, Arial, sans-serif'); text.setAttribute('fill','#f5a425'); text.setAttribute('font-weight','bold'); text.textContent='E';
      const p1 = document.createElementNS('http://www.w3.org/2000/svg','path'); p1.setAttribute('d','M16 48 Q32 40 48 48'); p1.setAttribute('stroke','#f5a425'); p1.setAttribute('stroke-width','3'); p1.setAttribute('fill','none');
      const p2 = document.createElementNS('http://www.w3.org/2000/svg','path'); p2.setAttribute('d','M20 48 Q32 44 44 48'); p2.setAttribute('stroke','#f5a425'); p2.setAttribute('stroke-width','3'); p2.setAttribute('fill','none');
      svg.appendChild(circle); svg.appendChild(text); svg.appendChild(p1); svg.appendChild(p2);
      logo.insertBefore(svg, logo.firstChild);
    }

    // Ensure Courses dropdown exists
    const menu = header.querySelector('.main-nav .main-menu');
    if(menu){
      let courses = Array.from(menu.children).find(li=> /courses/i.test(li.textContent||''));
      if(!courses || !courses.classList.contains('has-submenu')){
        if(!courses){ courses = document.createElement('li'); menu.insertBefore(courses, menu.firstChild); }
        courses.className = 'has-submenu';
        courses.innerHTML = `<a href="course.html">Courses</a>
          <ul class="sub-menu">
            <li><a href="course.html">All Courses</a></li>
            <li><a href="webdev.html">Web Development</a></li>
            <li><a href="data.html">Data Science</a></li>
            <li><a href="ai.html">AI/ML</a></li>
            <li><a href="cyber.html">Cybersecurity</a></li>
            <li><a href="digital.html">Digital Marketing</a></li>
            <li><a href="graphic.html">Graphic Design</a></li>
            <li><a href="manage.html">Management</a></li>
            <li><a href="comm.html">Communication</a></li>
            <li><a href="ui.html">UI/UX Design</a></li>
          </ul>`;
      }
    }
  }

  // Assign stable ids to static cards that lack data-course-id (e.g., on index page)
  function ensureCourseCardIds(){
    const seen = new Set();
    const page = (location.pathname||'').split('/').pop();
    document.querySelectorAll('.course-card').forEach((card, idx)=>{
      if(card.hasAttribute('data-course-id')){ seen.add(card.getAttribute('data-course-id')); return; }
      const t = card.querySelector('.course-title-overlay h5')?.textContent
        || card.querySelector('img')?.getAttribute('alt') || 'course';
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      let id = `${page}-${slug}`;
      let n = 1; while(seen.has(id)){ id = `${page}-${slug}-${n++}`; }
      card.setAttribute('data-course-id', id); seen.add(id);
    });
  }

  function extractCourseFromCard(card){
    if(!card) return null;
    const id = card.getAttribute('data-course-id') || null;
    const title = card.querySelector('.course-title-overlay h5')?.textContent || card.querySelector('img')?.alt || 'Course';
    const priceText = card.querySelector('.course-price .price')?.textContent || '';
    const isFree = (priceText||'').toLowerCase().includes('free');
    const priceNum = isFree ? 0 : parseInt(((priceText||'').match(/\d+/g)||['0']).join(''),10);
    const img = card.querySelector('img')?.getAttribute('src') || '';
    const pageDetail = (/python for everybody/i.test(title) ? 'py.html' : (/full stack web development with javascript/i.test(title) ? 'full.html' : 'course.html'));
    return { id: id || title.toLowerCase().replace(/[^a-z0-9]+/g,'-'), title, price: priceNum, isFree, page: (location.pathname||'').split('/').pop(), image: img, pageDetail };
  }

  function updateNavAuth(){
    const user = getUser();
    const loginBtn = document.querySelector('.login-btn');
    if(loginBtn){
      loginBtn.innerHTML = user ? '<i class="fa fa-sign-out" title="Logout"></i>' : '<i class="fa fa-user" title="Login/Signup"></i>';
      loginBtn.href = user ? '#' : 'login.html';
    }
    // Keep navbar on same line as title; show welcome message as separate bar below
    const header = document.querySelector('header.main-header');
    if(header){
      // Remove any inline welcome we may have previously inserted
      const inline = document.getElementById('welcome-inline');
      if(inline) inline.remove();

      // Ensure header layout (logo + nav on one line)
      const style = document.getElementById('enrich-layout-style') || document.createElement('style');
      style.id = 'enrich-layout-style';
      style.textContent = `
        header.main-header{ position: sticky; top:0; z-index:1000; display:flex; align-items:center; justify-content:space-between; padding:6px 12px; }
        header.main-header .logo{ display:flex; align-items:center; }
        header.main-header #menu{ margin-left:auto; display:block !important; border-top:none; }
        #welcome-banner{ background:#0f1a2b; color:#f5a425; font-weight:800; padding:8px 16px; }
      `;
      document.head.appendChild(style);

      // Insert/update a separate welcome banner BELOW the header
      let banner = document.getElementById('welcome-banner');
      if(!banner){
        banner = document.createElement('div');
        banner.id = 'welcome-banner';
        header.after(banner);
      }
      banner.textContent = user ? `Hi, welcome ${user.name || user.username}` : 'Welcome to our unique eLearning platform';
    }

    // Switch Courses -> My Courses link
    const topLinks = document.querySelectorAll('.main-nav .main-menu > li > a');
    topLinks.forEach(a=>{
      if((a.textContent||'').trim().toLowerCase()==='courses' || (a.getAttribute('href')||'').includes('#section4')){
        if(user){ a.textContent='My Courses'; a.href='my_course.html'; }
        else { a.textContent='Courses'; a.href='#section4'; }
      }
    });
    updateCartCount();
  }

  function wireGlobal(){
    // Login/Logout button action
    document.addEventListener('click', function(e){
      const a = e.target.closest('.login-btn');
      if(!a) return;
      const user = getUser();
      if(user){
        e.preventDefault();
        // Clear cart on logout and then logout
        try{ clearCart(); }catch(_){ }
        clearUser();
        updateNavAuth();
        window.location.href = 'index.html';
      }
    });
    // Cart click navigates to cart page
    document.addEventListener('click', function(e){
      const a = e.target.closest('a[title="Cart"]');
      if(a){ e.preventDefault(); window.location.href = 'cart.html'; }
    });
    // Read More links for specific deep course pages
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.course-actions button, .course-actions .read-more');
      if(!btn) return;
      const label = (btn.textContent||'').trim().toLowerCase();
      if(!/read\s*more/.test(label)) return;
      const card = btn.closest('.course-card');
      const title = card?.querySelector('.course-title-overlay h5')?.textContent?.trim().toLowerCase();
      if(title === 'python for everybody'){
        e.preventDefault();
        window.location.href = 'py.html';
      } else if(title && title.indexOf('full stack web development with javascript') !== -1){
        e.preventDefault();
        window.location.href = 'full.html';
      } else if(title && title.indexOf('javascript essentials for beginners') !== -1){
        e.preventDefault();
        window.location.href = 'javascript-basics.html';
      } else if(title && title.indexOf('digital marketing masterclass') !== -1){
        e.preventDefault();
        window.location.href = 'digital-marketing.html';
      } else if(title && title.indexOf('java programming fundamentals') !== -1){
        e.preventDefault();
        window.location.href = 'java-basics.html';
      } else if(title && title.indexOf('data science essentials') !== -1){
        e.preventDefault();
        window.location.href = 'data-science.html';
      } else if(title && title.indexOf('machine learning basics') !== -1){
        e.preventDefault();
        window.location.href = 'machine-learning.html';
      } else if(title && title.indexOf('cybersecurity fundamentals') !== -1){
        e.preventDefault();
        window.location.href = 'cybersecurity.html';
      } else if(title && title.indexOf('graphic design masterclass') !== -1){
        e.preventDefault();
        window.location.href = 'graphic-design.html';
      } else if(title && title.indexOf('ui/ux design principles') !== -1){
        e.preventDefault();
        window.location.href = 'ui-ux-design.html';
      } else if(title && title.indexOf('project management essentials') !== -1){
        e.preventDefault();
        window.location.href = 'project-management.html';
      } else if(title && title.indexOf('business communication skills') !== -1){
        e.preventDefault();
        window.location.href = 'business-communication.html';
      }
    });
    // Enroll button
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.btn-enroll');
      if(!btn) return;
      e.preventDefault();
      const card = btn.closest('.course-card');
      const info = extractCourseFromCard(card);
      if(info){ sessionStorage.setItem('ENRICH_SELECTED', JSON.stringify(info)); }
      const user = getUser();
      if(!user){ sessionStorage.setItem('ENRICH_BACK','checkout.html'); window.location.href = 'login.html'; return; }
      window.location.href = 'checkout.html';
    });
    // Add to cart button
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.btn-add-cart');
      if(!btn) return;
      e.preventDefault();
      const card = btn.closest('.course-card');
      const info = extractCourseFromCard(card);
      if(info) addToCart(info);
    });
  }

  // Theme toggle
  function injectThemeToggle(){
    let btn = document.getElementById('theme-toggle');
    if(!btn){
      const nav = document.querySelector('.main-nav .main-menu');
      if(nav){
        const li = document.createElement('li');
        btn = document.createElement('a');
        btn.href = '#'; btn.id = 'theme-toggle'; btn.innerHTML = '<i class="fa fa-adjust" title="Toggle Theme"></i>';
        li.appendChild(btn); nav.appendChild(li);
      }
    }
    const style = document.createElement('style');
    style.textContent = `
      body.theme-dark{ background:#10161d; color:#eaeaea; }
      body.theme-dark .main-header{ background:#0f1a2b; }
      body.theme-dark .course-card{ background:#182233; color:#eaeaea; }
      body.theme-dark .course-card .course-content{ background:#182233; }
      body.theme-dark a{ color:#f5a425; }
    `; document.head.appendChild(style);

    // restore saved theme
    try{ const saved = localStorage.getItem('ENRICH_THEME'); if(saved==='dark'){ document.body.classList.add('theme-dark'); } }catch(e){}
    document.addEventListener('click', function(e){
      const tgl = e.target.closest('#theme-toggle');
      if(tgl){ e.preventDefault(); document.body.classList.toggle('theme-dark'); try{ localStorage.setItem('ENRICH_THEME', document.body.classList.contains('theme-dark')?'dark':'light'); }catch(_){} }
    });
  }

  $(function(){
    try{ updateNavAuth(); }catch(e){}
    try{ wireGlobal(); }catch(e){}
    try{ injectThemeToggle(); }catch(e){}
    try{ insertBreadcrumbs(); }catch(e){}
    try{ ensureCourseCardIds(); }catch(e){}
    try{ updateCartCount(); }catch(e){}
    try{ ensureLogoAndCoursesDropdown(); }catch(e){}
    try{ updateFooterCopyright(); }catch(e){}
  });

  // Ensure action buttons exist across static cards (index/home)
  (function ensureButtons(){
    function fix(){
      document.querySelectorAll('.course-actions').forEach(act => {
        // Enroll class
        const enroll = act.querySelector('.btn-enroll') || Array.from(act.querySelectorAll('button')).find(b=>/enroll/i.test(b.textContent||''));
        if(enroll && !enroll.classList.contains('btn-enroll')) enroll.classList.add('btn-enroll');
        // Add to cart
        if(!act.querySelector('.btn-add-cart')){
          const add = document.createElement('button');
          add.className = 'btn btn-outline-secondary btn-sm btn-add-cart';
          add.textContent = 'Add to Cart';
          act.appendChild(add);
        }
      });
      ensureCourseCardIds();
    }
    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', fix); } else { fix(); }
  })();

  // Lightweight hover tooltip for course cards
  (function setupCardHover(){
    const tip = document.createElement('div');
    tip.id = 'enrich-card-tooltip';
    tip.style.position='fixed'; tip.style.zIndex='2000'; tip.style.display='none';
    tip.style.background='rgba(0,0,0,0.85)'; tip.style.color='#fff'; tip.style.padding='8px 10px'; tip.style.borderRadius='6px'; tip.style.fontSize='12px';
    document.body.appendChild(tip);
    function buildText(card){
      const title = card.querySelector('.course-title-overlay h5')?.textContent?.trim() || 'Course';
      const tutor = card.querySelector('.tutor-info span')?.textContent?.trim() || '';
      const rating = card.querySelector('.rating-info span')?.textContent?.trim() || '';
      const price = card.querySelector('.course-price .price')?.textContent?.trim() || '';
      return `${title}\n${tutor ? 'By '+tutor+' · ' : ''}${rating}${price? ' · '+price: ''}`;
    }
    document.addEventListener('mouseenter', function(e){
      const card = e.target.closest && e.target.closest('.course-card');
      if(!card) return;
      tip.textContent = buildText(card);
      tip.style.display = 'block';
      const rect = card.getBoundingClientRect();
      tip.style.left = (rect.left + 12) + 'px';
      tip.style.top = (rect.top + 12) + 'px';
    }, true);
    document.addEventListener('mousemove', function(e){ if(tip.style.display!=='none'){ tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY+12)+'px'; } });
    document.addEventListener('mouseleave', function(e){ if(e.target.closest && e.target.closest('.course-card')){ tip.style.display='none'; } }, true);
  })();

  function updateFooterCopyright(){
    const footers = document.querySelectorAll('footer p');
    footers.forEach(p=>{ p.textContent = '© 2025 ENRICH'; });
  }

  // Breadcrumbs (below welcome banner on all pages except index.html)
  function insertBreadcrumbs(){
    try{
      const file = (location.pathname||'').split('/').pop()||'index.html';
      if(file==='index.html') return; // no breadcrumb on home
      if(document.getElementById('global-breadcrumbs')) return;
      const header = document.querySelector('header.main-header'); if(!header) return;
      const afterEl = document.getElementById('welcome-banner') || header;
      const nav = document.createElement('nav'); nav.id='global-breadcrumbs'; nav.setAttribute('aria-label','breadcrumb');
      nav.innerHTML = '<ol class="breadcrumb" style="margin:0; padding:8px 16px; background:#fff; border-bottom:1px solid #eee;"><li class="breadcrumb-item"><a href="index.html">Home</a></li></ol>';
      afterEl.after(nav);
      const ol = nav.querySelector('ol');
      const map = { 'index.html':'Home', 'about.html':'About', 'course.html':'All Courses', 'cart.html':'Cart', 'checkout.html':'Checkout', 'review.html':'Review', 'confirmation.html':'Confirmation', 'login.html':'Login', 'signup.html':'Signup', 'webdev.html':'Web Development', 'data.html':'Data Science', 'ai.html':'AI/ML', 'cyber.html':'Cybersecurity', 'digital.html':'Digital Marketing', 'graphic.html':'Graphic Design', 'manage.html':'Management', 'comm.html':'Communication', 'ui.html':'UI/UX Design', 'py.html':'Python for Everybody', 'my_course.html':'My Courses' };
      function addCrumb(href, label, active){ const li = document.createElement('li'); li.className = 'breadcrumb-item'+(active?' active':''); if(active){ li.textContent = label; } else { const a = document.createElement('a'); a.href=href; a.textContent=label; li.appendChild(a);} ol.appendChild(li);} 
      if(file==='review.html'){ addCrumb('cart.html','Cart'); addCrumb('checkout.html','Checkout'); addCrumb('#','Review',true); }
      else if(file==='confirmation.html'){ addCrumb('cart.html','Cart'); addCrumb('checkout.html','Checkout'); addCrumb('review.html','Review'); addCrumb('#','Confirmation',true); }
      else if(map[file]){ addCrumb('#', map[file], true); }
    }catch(e){}
  }

  // Expose for pages that need cart operations
  window.EnrichAuthCart = { getUser, setUser, clearUser, getCart, saveCart, addToCart, removeFromCart, clearCart, updateCartCount, updateNavAuth, getEnrolments, saveEnrolments, addEnrolments };
})(window, document, window.jQuery);


