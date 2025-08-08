(function(window, document){
  const STORAGE_KEY = 'ENRICH_COURSE_INDEX_V1';

  function readIndex(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
  }
  function writeIndex(idx){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(idx)); } catch(e){}
  }
  function dedupeById(items){
    const seen = new Set();
    const out = [];
    for(const it of items){
      const key = it.id || `${it.url}|${it.title}`;
      if(!seen.has(key)) { seen.add(key); out.push(it); }
    }
    return out;
  }

  // Inject minimal styles and overlay DOM
  function injectOverlay(){
    if(document.getElementById('enrich-search-overlay')) return;
    const style = document.createElement('style');
    style.textContent = `
      #enrich-search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;z-index:1050}
      #enrich-search-overlay.active{display:block}
      .enrich-search-panel{position:absolute;left:50%;top:12%;transform:translateX(-50%);width:min(780px,92%);background:#fff;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.25);overflow:hidden}
      .enrich-search-header{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #eee}
      .enrich-search-input{flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:16px}
      .enrich-search-results{max-height:380px;overflow:auto}
      .enrich-search-item{padding:12px 16px;border-bottom:1px solid #f1f1f1;cursor:pointer}
      .enrich-search-item:hover{background:#f9f9f9}
      .enrich-search-meta{font-size:12px;color:#777}
      .enrich-search-close{background:none;border:none;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'enrich-search-overlay';
    overlay.innerHTML = `
      <div class="enrich-search-panel" role="dialog" aria-modal="true">
        <div class="enrich-search-header">
          <input id="enrich-search-input" class="enrich-search-input" type="text" placeholder="Search courses... (type and press Enter)" />
          <button id="enrich-search-close" class="enrich-search-close" aria-label="Close">×</button>
        </div>
        <div id="enrich-search-results" class="enrich-search-results"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function openOverlay(){
    injectOverlay();
    const overlay = document.getElementById('enrich-search-overlay');
    overlay.classList.add('active');
    const input = document.getElementById('enrich-search-input');
    input.value = '';
    // Do not display any options until user types
    const resultsEl = document.getElementById('enrich-search-results');
    resultsEl.innerHTML = '';
    setTimeout(()=> input.focus(), 50);
  }
  function closeOverlay(){
    const overlay = document.getElementById('enrich-search-overlay');
    if(overlay) overlay.classList.remove('active');
  }

  function renderResults(query){
    const resultsEl = document.getElementById('enrich-search-results');
    const idx = readIndex();
    const q = (query||'').trim().toLowerCase();
    if(!q){ resultsEl.innerHTML = ''; return; }
    // Starts-with matching on title, fallback to includes
    let items = idx.filter(it => (it.title||'').toLowerCase().startsWith(q));
    if(!items.length){
      items = idx.filter(it => (it.title||'').toLowerCase().includes(q) || (it.category||'').toLowerCase().includes(q));
    }
    // Group by category then page, keep all matches
    items = items.sort((a,b)=> (a.category===b.category? (a.page<b.page?-1:(a.page>b.page?1:0)) : (a.category<b.category?-1:1)));
    resultsEl.innerHTML = items.map(it => `
      <div class="enrich-search-item" data-url="${it.url}" data-title="${it.title}">
        <div><strong>${it.title}</strong></div>
        <div class="enrich-search-meta">${it.category || ''} · ${it.page || ''}</div>
      </div>
    `).join('') || '<div class="enrich-search-item">No results</div>';
  }

  function navigateTo(url, title){
    const sep = url.includes('?') ? '&' : '?';
    const target = `${url}${sep}q=${encodeURIComponent(title)}`;
    window.location.href = target;
  }

  function categoryPageMap(){
    return {
      'web-development': 'webdev.html',
      'data-science': 'data.html',
      'ai-ml': 'ai.html',
      'cybersecurity': 'cyber.html',
      'digital-marketing': 'digital.html',
      'graphic-design': 'graphic.html',
      'management': 'manage.html',
      'communication': 'comm.html',
      'ui-ux-design': 'ui.html'
    };
  }

  function seedFromDOM(){
    const map = categoryPageMap();
    const items = [];
    // Cards with explicit data-category (index page)
    document.querySelectorAll('[data-category] .course-card .course-title-overlay h5').forEach(h5 => {
      const title = h5.textContent.trim();
      const wrapper = h5.closest('[data-category]');
      const key = wrapper ? wrapper.getAttribute('data-category') : null;
      const url = key && map[key] ? map[key] : (location.pathname.split('/').pop() || 'index.html');
      const category = (key||'').replace(/-/g,' ');
      items.push({ title, url, category, page: url });
    });
    // If on a category page, also register visible cards
    const titleEl = document.getElementById('category-courses-title');
    if(titleEl){
      const page = location.pathname.split('/').pop();
      const cat = (titleEl.textContent||'').replace(/ Courses.*/, '');
      document.querySelectorAll('#category-courses-grid .course-card .course-title-overlay h5, #trending-courses-grid .course-card h5, #featured-courses-grid .course-card h5').forEach(h5=>{
        items.push({ title: h5.textContent.trim(), url: page, category: cat, page });
      });
    }
    if(items.length && window.EnrichSearch){
      const current = readIndex();
      writeIndex(dedupeById(current.concat(items)));
    }
  }

  function wireEvents(){
    // Open via nav search icon
    document.addEventListener('click', function(e){
      const a = e.target.closest('a[title="Search"]');
      if(a){ e.preventDefault(); openOverlay(); }
      const item = e.target.closest('.enrich-search-item');
      if(item && item.dataset && item.dataset.url){ navigateTo(item.dataset.url, item.dataset.title||''); }
      if(e.target && (e.target.id === 'enrich-search-overlay')){ closeOverlay(); }
      if(e.target && e.target.id === 'enrich-search-close'){ closeOverlay(); }
    });
    // Keyboard
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeOverlay(); });
    document.addEventListener('input', function(e){ if(e.target && e.target.id === 'enrich-search-input') renderResults(e.target.value); });
    document.addEventListener('keydown', function(e){
      if(e.target && e.target.id === 'enrich-search-input' && e.key === 'Enter'){
        const first = document.querySelector('#enrich-search-results .enrich-search-item');
        if(first && first.dataset && first.dataset.url){ navigateTo(first.dataset.url, first.dataset.title||''); }
      }
    });
  }

  // Public API
  const EnrichSearch = {
    registerCourses: function(pageUrl, categoryName, courses){
      if(!Array.isArray(courses)) return;
      const current = readIndex();
      const mapped = courses.map(c => ({
        id: c.id,
        title: c.title,
        url: pageUrl,
        category: categoryName || c.category,
        page: pageUrl.replace(/.*\//,'')
      }));
      writeIndex(dedupeById(current.concat(mapped)));
    },
    open: openOverlay,
    close: closeOverlay
  };

  window.EnrichSearch = EnrichSearch;
  wireEvents();
  // Seed initial results from whatever page the user is on
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', seedFromDOM); } else { seedFromDOM(); }
})(window, document);


