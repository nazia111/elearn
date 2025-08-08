(function(window, document, $){
  if(!$) return;

  const CATEGORY_TO_PAGE = {
    'Web Development': 'webdev.html',
    'Data Science': 'data.html',
    'AI/ML': 'ai.html',
    'Cybersecurity': 'cyber.html',
    'Digital Marketing': 'digital.html',
    'Graphic Design': 'graphic.html',
    'Management': 'manage.html',
    'Communication': 'comm.html',
    'UI/UX Design': 'ui.html',
    'All': 'index.html#section4'
  };

  const DEFAULT_INSTRUCTORS = [
    'Priya Sharma','Sarah Wilson','Jhon Doe','Ravi Patel','Neha Verma','Alex Rodriguez','Emily Chen','David Kim','Lisa Wang','Robert Smith','Jennifer Lee','Sophie Anderson'
  ];

  function generateCourses(categoryName, subcategories){
    const images = ['assets/images/courses-01.jpg','assets/images/courses-02.jpg','assets/images/courses-03.jpg','assets/images/courses-04.jpg'];
    const levels = ['Beginner','Intermediate','Advanced'];
    const list = [];
    let idSeq = 1;
    subcategories.forEach((subcat, sIdx) => {
      for(let i=1;i<=6;i++){
        const instructor = DEFAULT_INSTRUCTORS[(sIdx*6 + i) % DEFAULT_INSTRUCTORS.length];
        const level = levels[(i-1)%levels.length];
        const isFree = (level==='Beginner' && i%3===1);
        const price = isFree ? 0 : (1500 + ((sIdx+i)*200));
        const original = isFree ? 0 : price + 1200;
        const rating = 4 + ((i%3)+1)/10; // 4.1 - 4.3, etc
        const ratingCount = 150 + (sIdx*80) + i*20;
        const image = images[(sIdx+i)%images.length];
        const date = new Date(2024, (sIdx+i)%12, 1 + (i*3)%25).toISOString().slice(0,10);
        list.push({
          id: `${categoryName.replace(/\W+/g,'').toLowerCase()}-${idSeq++}`,
          title: `${subcat} ${categoryName} Course ${i}`,
          instructor,
          category: categoryName,
          subcategory: subcat,
          level,
          isFree,
          price,
          originalPrice: original,
          rating,
          ratingCount,
          image,
          isTrending: false,
          isFeatured: false,
          dateAdded: date
        });
      }
    });
    // Mark trending/featured and enforce only 2 free per category (already ensured by generator: Beginner items every 3rd as free -> may exceed; enforce here)
    let freeAssigned = 0;
    list.forEach((c, idx)=> {
      if(idx%7===0) c.isTrending = true; if(idx%11===0) c.isFeatured = true;
      if(c.isFree){ if(freeAssigned<2){ freeAssigned++; } else { c.isFree=false; c.price = Math.max(c.price, 1499); c.originalPrice = c.price + 1200; } }
    });
    return list;
  }

  function formatPrice(course){
    if(course.isFree) return '<span class="price">Free</span>';
    const price = `₹${course.price.toLocaleString()}`;
    const original = course.originalPrice ? ` <span class="original-price">₹${course.originalPrice.toLocaleString()}</span>` : '';
    return `<span class="price">${price}</span>${original}`;
  }

  function renderCard(course, badge){
    const badgeHtml = badge ? `<span class="featured-badge">${badge}</span>` : '';
    return `
      <div class="col-lg-4 col-md-6 mb-4" data-course-id="${course.id}">
        <div class="course-card">
          ${badgeHtml}
          <div class="course-image">
            <img src="${course.image}" alt="${course.title}">
            <div class="course-title-overlay"><h5>${course.title}</h5></div>
            <div class="course-overlay">
              <div class="course-actions">
                <button class="btn btn-outline-primary btn-sm">Read More</button>
                <button class="btn btn-primary btn-sm btn-enroll">Enroll Now</button>
                <button class="btn btn-outline-secondary btn-sm btn-add-cart">Add to Cart</button>
              </div>
            </div>
          </div>
          <div class="course-content">
            <div class="course-meta">
              <div class="tutor-info"><i class="fa fa-user"></i><span>${course.instructor}</span></div>
              <div class="rating-info"><i class="fa fa-star"></i><span>${course.rating.toFixed(1)} (${course.ratingCount})</span></div>
            </div>
            <div class="course-price">${formatPrice(course)}</div>
          </div>
        </div>
      </div>`;
  }

  function initCategoryPage(config){
    const categoryName = config.categoryName;
    const subcategories = config.subcategories || [];
    const courses = (config.courses && config.courses.length) ? config.courses : generateCourses(categoryName, subcategories);

    const state = { category: categoryName, subcategory: 'All', search:'', level:'All', pricing:'All', sort:'relevance', showAll:false };

    function courseMatchesFilters(course){
      if(state.subcategory !== 'All' && course.subcategory !== state.subcategory) return false;
      if(state.level !== 'All' && course.level !== state.level) return false;
      if(state.pricing !== 'All'){
        const desiredFree = state.pricing === 'Free';
        if(desiredFree !== course.isFree) return false;
      }
      if(state.search){
        const q = state.search.trim().toLowerCase();
        const hay = `${course.title} ${course.instructor} ${course.category} ${course.subcategory}`.toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    }

    function sortCourses(list){
      const arr = list.slice();
      switch(state.sort){
        case 'rating-desc': arr.sort((a,b)=> b.rating - a.rating || b.ratingCount - a.ratingCount); break;
        case 'newest': arr.sort((a,b)=> new Date(b.dateAdded) - new Date(a.dateAdded)); break;
        case 'price-asc': arr.sort((a,b)=> (a.isFree?0:a.price) - (b.isFree?0:b.price)); break;
        case 'price-desc': arr.sort((a,b)=> (b.isFree?0:b.price) - (a.isFree?0:a.price)); break;
        default: arr.sort((a,b)=> (b.isTrending?1:0)+(b.isFeatured?1:0) - ((a.isTrending?1:0)+(a.isFeatured?1:0))); break;
      }
      return arr;
    }

    function renderCategoryCourses(){
      const $grid = $('#category-courses-grid');
      let filtered = sortCourses(courses.filter(courseMatchesFilters));
      const list = state.showAll ? filtered : filtered.slice(0,6);
      const cards = list.map(c=> renderCard(c, c.isTrending? 'Trending' : (c.isFeatured? 'Featured' : null))).join('');
      $grid.html(cards || '<div class="col-12"><p>No courses found.</p></div>');
      $('#category-courses-title').text(`${categoryName} Courses`);
    }
    function renderTrending(){
      const $grid = $('#trending-courses-grid');
      const list = sortCourses(courses.filter(c=>c.isTrending).filter(courseMatchesFilters)).slice(0,2);
      $grid.html(list.map(c=> renderCard(c,'Trending')).join('') || '<div class="col-12"><p>No trending courses.</p></div>');
    }
    function renderFeatured(){
      const $grid = $('#featured-courses-grid');
      const list = sortCourses(courses.filter(c=>c.isFeatured).filter(courseMatchesFilters)).slice(0,2);
      $grid.html(list.map(c=> renderCard(c,'Featured')).join('') || '<div class="col-12"><p>No featured courses.</p></div>');
    }
    function renderAll(){ renderCategoryCourses(); renderTrending(); renderFeatured(); }

    // Sidebar subcategories
    const $subs = $('#sidebar-subcategories');
    if($subs.length){
      const items = ['All'].concat(subcategories);
      $subs.html(items.map(sc => `<li><a href="#" data-subcat="${sc}">${sc}</a></li>`).join(''));
    }

    // Category pills navigation across pages
    const $pills = $('#category-pills');
    if($pills.length){
      $pills.on('click', '.webdev-category-pill', function(){
        const label = $(this).text().trim();
        if(label==='All'){ state.subcategory='All'; state.showAll=true; renderAll(); return; }
        const url = CATEGORY_TO_PAGE[label];
        if(url){ window.location.href = url; }
      });
    }

    // Filters wiring
    $('#sidebar-level').on('change', function(){ state.level = $(this).val(); $('#top-level').val(state.level); renderAll(); });
    $('#sidebar-pricing').on('change', function(){ state.pricing = $(this).val(); $('#top-pricing').val(state.pricing); renderAll(); });
    $('#sidebar-category').closest('form').find('select#sidebar-category').prop('disabled', false);
    $('#sidebar-subcategories').on('click', 'a[data-subcat]', function(e){ e.preventDefault(); state.subcategory = $(this).data('subcat'); renderAll(); });

    // Optional top bar controls if present
    $('#top-level').on('change', function(){ state.level = $(this).val(); $('#sidebar-level').val(state.level); renderAll(); });
    $('#top-pricing').on('change', function(){ state.pricing = $(this).val(); $('#sidebar-pricing').val(state.pricing); renderAll(); });
    $('#top-search').on('input', function(){ state.search = $(this).val(); renderAll(); });
    $('#top-sort').on('change', function(){ state.sort = $(this).val(); renderAll(); });

    // Initial UI values
    $('#sidebar-category').val(categoryName);
    $('#top-sort').val('relevance');

    // Initial render
    renderAll();

    // Register with global search index
    if(window.EnrichSearch){
      const page = (location.pathname||'').split('/').pop() || 'index.html';
      window.EnrichSearch.registerCourses(page, categoryName, courses);
    }

    // Deep link support: ?q=keyword
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if(q){
      $('#top-search').val(q);
      state.search = q;
      renderAll();
      setTimeout(()=>{
        const needle = q.toLowerCase();
        let $target = null;
        $('#category-courses-grid .course-card h5, #trending-courses-grid .course-card h5, #featured-courses-grid .course-card h5').each(function(){
          if(!$target && $(this).text().toLowerCase().includes(needle)){
            $target = $(this).closest('.course-card');
          }
        });
        if($target && $target.length){
          $('html,body').animate({scrollTop: $target.offset().top - 120}, 500);
          $target.addClass('search-highlight');
          setTimeout(()=> $target.removeClass('search-highlight'), 3500);
        }
      }, 50);
    }
  }

  window.initCategoryPage = initCategoryPage;
})(window, document, window.jQuery);


