// scripts/producto.js
document.addEventListener('DOMContentLoaded', () => {
  // Lee ?id=... de la URL
  const params = new URLSearchParams(location.search);
  const id = (params.get('id') || '').trim();

  // Elementos
  const elTitle     = document.getElementById('prodTitle');
  const elImage     = document.getElementById('prodImage');
  const elExcerpt   = document.getElementById('prodExcerpt');
  const elLinea     = document.getElementById('prodLinea');
  const elCategoria = document.getElementById('prodCategoria');
  const elFicha     = document.getElementById('prodFicha');
  const elBreadcrumb= document.getElementById('breadcrumb');
  const elDraft     = document.getElementById('prodDraft');
  const elPresent   = document.getElementById('prodPresentaciones');

  // Render 404 básico
  function renderNotFound() {
    elTitle.textContent = 'Producto no encontrado';
    elExcerpt.textContent = 'No pudimos encontrar este producto. Verifica el enlace o regresa al catálogo.';
    elImage.src = '/assets/img/logo-psmax.png';
    if (elFicha) elFicha.classList.add('hidden');
    if (elBreadcrumb) {
      elBreadcrumb.innerHTML = `<a class="hover:underline" href="/productos.html">Productos</a> / <span class="text-slate-400">No encontrado</span>`;
    }
  }

  if (!id) { renderNotFound(); return; }

  // Carga el JSON del producto
  const url = `/content/productos/${id}.json`;

  fetch(url, { cache: 'no-cache' })
    .then(async (res) => {
      if (!res.ok) throw new Error('404');
      const data = await res.json();

      // Campos esperados por tu config.yml:
      // title, linea, categoria, excerpt, image, ficha, published
      elTitle.textContent = data.title || 'Producto';
      elExcerpt.textContent = data.excerpt || '';
      elImage.src = data.image || '/assets/img/logo-psmax.png';
      elImage.alt = data.title || 'Producto';

      elLinea.textContent = data.linea || '';
      elCategoria.textContent = data.categoria || '';

      if (data.ficha) {
        elFicha.href = data.ficha;
      } else {
        elFicha.classList.add('hidden');
      }

      if (data.published === false) {
        elDraft.classList.remove('hidden');
      }
      // ===== Presentaciones de los Productos =====
      // data.presentaciones puede ser array de objetos {empaque, volumen, unidad, nota}
      // o de strings (el código soporta ambos)
      function formatPres(p) {
        if (!p) return '';
        if (typeof p === 'string') return p;
        const base = `${p.empaque || ''} x ${p.volumen ?? ''}${p.unidad || ''}`.trim();
        return p.nota ? `${base} (${p.nota})` : base;
      }

      if (Array.isArray(data.presentaciones) && elPresent) {
        const chips = data.presentaciones
          .map(item => `<span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border text-sm">${formatPres(item)}</span>`)
          .join('');
        if (chips) {
          elPresent.innerHTML = `
            <div class="text-sm text-slate-500 w-full">Presentaciones:</div>
            <div class="flex flex-wrap gap-2 mt-1">${chips}</div>
          `;
        }
      }
      // ===== Fin presentaciones =====

      // Migas de pan
      const lineaURL = '/productos.html#' + (data.linea ? data.linea.toLowerCase().replace(/\s+/g,'-') : 'productos');
      if (elBreadcrumb) {
        elBreadcrumb.innerHTML = `
          <a class="hover:underline" href="/productos.html">Productos</a>
          / <a class="hover:underline" href="${lineaURL}">${data.linea || 'Línea'}</a>
          / <span class="text-slate-400">${data.title || 'Producto'}</span>
        `;
      }
    })
    .catch(() => {
      renderNotFound();
    });
});