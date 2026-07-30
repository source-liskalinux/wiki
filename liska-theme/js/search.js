document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('wiki-search-input');
  const searchResults = document.getElementById('wiki-search-results');
  if (!searchInput || !searchResults) return;
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
      searchData.forEach(doc => {
        this.add(doc);
      });
    });
  } catch (err) {
    console.error('Failed to load search index:', err);
  }
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length < 2 || !lunrIndex) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }
    const matches = lunrIndex.search(`*${query}*`);
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-no-result">No results found.</div>';
      searchResults.style.display = 'block';
      return;
    }
    let html = '';
    matches.slice(0, 6).forEach(result => {
      const doc = searchData.find(d => d.location === result.ref);
      if (doc) {
        const docUrl = baseUrl + '/' + doc.location;
        html += `
          <a href="${docUrl}" class="search-result-item">
            <div class="result-title">${doc.title}</div>
            <div class="result-text">${(doc.text || '').substring(0, 80)}....</div>
          </a>
        `;
      }
    });
    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      searchResults.style.display = 'none';
    }
  });
});
