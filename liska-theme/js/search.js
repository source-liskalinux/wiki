document.addEventListener('DOMContentLoaded', async () => {
  const openBtn = document.getElementById('search-open-btn');
  const closeBtn = document.getElementById('search-close-btn');
  const backdrop = document.getElementById('search-backdrop');
  const modal = document.getElementById('search-modal');
  const searchInput = document.getElementById('wiki-search-input');
  const searchResults = document.getElementById('wiki-search-results');
  if (!modal || !searchInput) return;
  const openModal = () => {
    modal.classList.add('is-active');
    setTimeout(() => {
      searchInput.focus();
    }, 150);
  };
  const closeModal = () => {
    modal.classList.remove('is-active');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.blur();
  };
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });
  let searchData = [];
  let lunrIndex = null;
  try {
    const response = await fetch(searchIndexUrl);
    const data = await response.json();
    searchData = data.docs;
    lunrIndex = lunr(function () {
      this.ref('location');
      this.field('title', { boost: 10 });
      this.field('text');
      searchData.forEach(doc => this.add(doc));
    });
  } catch (err) {
    console.error('Error search index:', err);
  }
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length < 2 || !lunrIndex) {
      searchResults.innerHTML = '';
      return;
    }
    const matches = lunrIndex.search(`*${query}*`);
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">No results found.</div>';
      return;
    }
    let html = '';
    matches.slice(0, 8).forEach(result => {
      const doc = searchData.find(d => d.location === result.ref);
      if (doc) {
        const docUrl = baseUrl + '/' + doc.location;
        html += `
          <a href="${docUrl}" class="search-result-item">
            <div class="result-title">${doc.title}</div>
            <div class="result-text">${(doc.text || '').substring(0, 90)}....</div>
          </a>
        `;
      }
    });
    searchResults.innerHTML = html;
  });
});
