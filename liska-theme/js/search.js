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
    const pageSearchData = searchData.filter(doc => !doc.location.includes('#'));
    lunrIndex = lunr(function () {
      this.ref('location');
      this.field('title', { boost: 10 });
      this.field('text');
      pageSearchData.forEach(doc => this.add(doc));
    });
    searchData = pageSearchData;
  } catch (err) {
    console.error('Error search index:', err);
  }
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length < 2 || !lunrIndex) {
      searchResults.innerHTML = '';
      return;
    }
    const lunrQuery = query
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `title:${term}*`)
      .join(' ');
    const matches = lunrIndex.search(lunrQuery);
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">No results found.</div>';
      return;
    }
    const uniqueResults = [];
    const seenLocations = new Set();
    for (const result of matches) {
      const doc = searchData.find(d => d.location === result.ref);
      if (!doc) continue;
      const pageLocation = doc.location.split('#')[0] || '';
      if (seenLocations.has(pageLocation)) continue;
      seenLocations.add(pageLocation);
      uniqueResults.push(doc);
      if (uniqueResults.length >= 8) break;
    }

    if (uniqueResults.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">No results found.</div>';
      return;
    }

    let html = '';
    uniqueResults.forEach(doc => {
      const docUrl = baseUrl + '/' + doc.location;
      html += `
        <a href="${docUrl}" class="search-result-item">
          <div class="result-title">${doc.title}</div>
          <div class="result-text">${(doc.text || '').substring(0, 90)}....</div>
        </a>
      `;
    });
    searchResults.innerHTML = html;
  });
});
