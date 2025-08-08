(function(window){
  // This script expects a global window.EnrichSearch defined by site-search.js
  // Each page should call EnrichSearch.registerCourses with its dataset.
  // For the webdev page, we hook after DOM ready via a small polling.
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  onReady(function(){
    // If page has a COURSES constant (from inline script), register them.
    try {
      if(typeof window !== 'undefined' && window.EnrichSearch){
        // Attempt to extract courses array from in-page closure via a hint.
        // We expose a minimal bridge if available.
        if(window.__ENRICH_EXPORT__ && Array.isArray(window.__ENRICH_EXPORT__.courses)){
          const page = (location.pathname||'').split('/').pop() || 'index.html';
          const cat = window.__ENRICH_EXPORT__.category || 'All';
          window.EnrichSearch.registerCourses(page, cat, window.__ENRICH_EXPORT__.courses);
        }
      }
    } catch(e){}
  });
})(window);


