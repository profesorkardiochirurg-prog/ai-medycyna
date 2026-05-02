async function loadArticles() {
  const list = document.getElementById('article-list');
  if (!list) return;

  try {
    const res = await fetch('articles.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('articles.json not found');
    const articles = await res.json();

    if (!articles.length) {
      list.innerHTML = '<p class="loading">Pierwsze artykuły pojawią się wkrótce.</p>';
      return;
    }

    articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    list.innerHTML = articles.map(a => `
      <a class="article-card" href="articles/${a.slug}.html">
        <div class="meta">
          <time>${formatDate(a.date)}</time>
          ${(a.tags || []).map(t => `<span class="tag">${escape(t)}</span>`).join('')}
        </div>
        <h3>${escape(a.title)}</h3>
        <p>${escape(a.excerpt || '')}</p>
      </a>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="loading">Nie udało się wczytać artykułów.</p>';
    console.error(err);
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadArticles();
