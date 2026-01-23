// scripts/productos.js
document.addEventListener('DOMContentLoaded', async () => {
  function slugify(str) {
  return String(str || '')
    .normalize('NFD')                  // separa acentos
    .replace(/[\u0300-\u036f]/g, '')   // elimina acentos
    .toLowerCase()
    .replace(/\s+/g, '-');             // espacios -> guiones
}
  const grid    = document.getElementById('productosGrid');
  const msg     = document.getElementById('productosMensaje');
  if (!grid) return;

  try {
    // 1) Cargar índice
    const idxRes = await fetch('/content/products_index.json', { cache: 'no-cache' });
    if (!idxRes.ok) throw new Error('No se pudo cargar products_index.json');
    const idx = await idxRes.json();

    const ids = Array.isArray(idx.items) ? idx.items.map(i => i.product).filter(Boolean) : [];
    if (!ids.length) {
      msg.textContent = 'No hay productos publicados en el índice.';
      msg.classList.remove('hidden');
      return;
    }

    // 2) Cargar cada producto por su ID (slug => filename)
    const productos = [];
    for (const id of ids) {
      try {
        const pRes = await fetch(`/content/productos/${id}.json`, { cache: 'no-cache' });
        if (!pRes.ok) continue;
        const p = await pRes.json();
        // Guarda el id para construir el enlace
        p.__id = id;
        if (p.published === false) continue;
        productos.push(p);
      } catch {}
    }

    if (!productos.length) {
      msg.textContent = 'No se encontraron productos publicados.';
      msg.classList.remove('hidden');
      return;
    }

    // 3) Agrupar por línea
    const porLinea = {};
    for (const p of productos) {
      const linea = p.linea || 'Otros';
      (porLinea[linea] ||= []).push(p);
    }

    // 4) Render
    grid.innerHTML = Object.entries(porLinea).map(([linea, items]) => `
      <div class="mt-12">
        <h2 id="${slugify(linea)}" class="text-2xl font-bold text-primary-800 mb-6 section-anchor-offset">${linea}</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          ${items.map(p => `
            <a href="/producto.html?id=${encodeURIComponent(p.__id)}"
               class="block bg-white p-6 rounded-2xl border hover:shadow-md transition">
              ${p.image ? `<img src="${p.image}" alt="${p.title}" class="w-full h-40 object-contain mb-4 rounded-lg bg-slate-50" loading="lazy">` : ''}
              <h3 class="font-semibold text-primary-700">${p.title}</h3>
              <p class="text-sm text-slate-600 mt-1">${p.excerpt || ''}</p>
              <span class="inline-block mt-3 text-accent-700 hover:underline text-sm">Ver producto →</span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
     // Si llegamos con un hash en la URL (#aseo-de-cocinas, etc.),
     // esperamos a que el DOM esté pintado y hacemos scroll a esa sección.
     if (window.location.hash) {
       const target = document.querySelector(window.location.hash);
       if (target) {
         // pequeño delay para asegurar que el layout terminó de calcularse
         setTimeout(() => {
           target.scrollIntoView({ behavior: "smooth", block: "start" });
         }, 100);
       }
     }
  } catch (e) {
    console.error(e);
    msg.textContent = 'No fue posible cargar el catálogo.';
    msg.classList.remove('hidden');
  }
});
