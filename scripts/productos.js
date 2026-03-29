document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("productosGrid");
  const msg = document.getElementById("productosMensaje");
  if (!grid) return;

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function sortByOrder(items = []) {
    return [...items].sort((a, b) => {
      const nameA = normalizeText(a?.nombre || a?.title || "");
      const nameB = normalizeText(b?.nombre || b?.title || "");
      return nameA.localeCompare(nameB, "es");
    });
  }

  function sortProducts(items = []) {
    return [...items].sort((a, b) => {
      const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : 9999;
      const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : 9999;

      if (orderA !== orderB) return orderA - orderB;

      const titleA = normalizeText(a?.title || "");
      const titleB = normalizeText(b?.title || "");
      return titleA.localeCompare(titleB, "es");
    });
  }

  function createProductCard(product) {
    return `
      <a href="/producto.html?id=${encodeURIComponent(product.__id)}"
         class="block bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition">
        ${
          product.image
            ? `<img src="${product.image}" alt="${product.title || ""}" class="w-full h-40 object-contain mb-4 rounded-lg bg-slate-50" loading="lazy">`
            : ""
        }
        <h4 class="font-semibold text-primary-700">${product.title || ""}</h4>
        <p class="text-sm text-slate-600 mt-1">${product.excerpt || ""}</p>
        <span class="inline-block mt-3 text-accent-700 hover:underline text-sm">Ver producto →</span>
      </a>
    `;
  }

  function getLineCandidates(value) {
    const raw = String(value || "").trim();
    const normalized = normalizeText(raw);
    const slug = slugify(raw);

    const candidates = new Set([normalized, slug]);

    // Compatibilidad mínima entre nombres viejos y nuevos de línea
    if (normalized === "aseo de cocinas") {
      candidates.add("aseo de cocina");
      candidates.add("aseo-de-cocina");
    }

    if (normalized === "aseo de cocina") {
      candidates.add("aseo de cocinas");
      candidates.add("aseo-de-cocinas");
    }

    if (normalized === "aseo y superficies") {
      candidates.add("aseo de pisos y superficies");
      candidates.add("aseo-de-pisos-y-superficies");
    }

    if (normalized === "aseo de pisos y superficies") {
      candidates.add("aseo y superficies");
      candidates.add("aseo-y-superficies");
    }

    return [...candidates];
  }

  function groupProductsBySubcategory(products = []) {
    const grouped = {};

    for (const product of products) {
      const key = normalizeText(product.categoria || "sin-subcategoria");

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(product);
    }

    return grouped;
  }

  function buildSectionHeader(title, slug) {
    return `
      <div class="product-line-header">
        <h2 id="${slug}" class="product-line-title section-anchor-offset">
          ${title}
        </h2>
      </div>
    `;
  }

  function buildSubcategoryBlock(title, items) {
    return `
      <div class="product-subcategory-block">
        <h3 class="product-subcategory-title">
          ${title}
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          ${sortProducts(items).map(createProductCard).join("")}
        </div>
      </div>
    `;
  }

  async function loadJSON(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${path}`);
    }
    return await response.json();
  }

  try {
    const [indexData, categoriesData] = await Promise.all([
      loadJSON("/content/products_index.json"),
      loadJSON("/content/product_categories.json")
    ]);

    const ids = Array.isArray(indexData.items)
      ? indexData.items.map((item) => item.product).filter(Boolean)
      : [];

    if (!ids.length) {
      msg.textContent = "No hay productos publicados en el índice.";
      msg.classList.remove("hidden");
      return;
    }

    const productos = [];

    for (const id of ids) {
      try {
        const product = await loadJSON(`/content/productos/${id}.json`);
        if (product.published === false) continue;

        productos.push({
          ...product,
          __id: id
        });
      } catch (error) {
        console.warn(`No se pudo cargar el producto ${id}`, error);
      }
    }

    if (!productos.length) {
      msg.textContent = "No se encontraron productos publicados.";
      msg.classList.remove("hidden");
      return;
    }

    const configuredLines = sortByOrder(categoriesData.lineas || []);
    const renderedLineKeys = new Set();
    let html = "";

    for (const line of configuredLines) {
      const lineCandidates = getLineCandidates(line.nombre);
      lineCandidates.push(normalizeText(line.slug));

      const lineProducts = sortProducts(
        productos.filter((product) => {
          const productLineCandidates = getLineCandidates(product.linea);
          return productLineCandidates.some((candidate) =>
            lineCandidates.includes(candidate)
          );
        })
      );

      if (!lineProducts.length) continue;

      renderedLineKeys.add(normalizeText(line.nombre));
      renderedLineKeys.add(normalizeText(line.slug));

      const grouped = groupProductsBySubcategory(lineProducts);
      const subcategories = sortByOrder(
        (line.subcategorias || []).filter((item) => item.activa !== false)
      );

      let lineHtml = `
        <section class="product-line-section">
          ${buildSectionHeader(line.nombre, line.slug || slugify(line.nombre))}
      `;

      const renderedCategoryKeys = new Set();

      for (const subcategory of subcategories) {
        const categoryKey = normalizeText(subcategory.nombre);
        const productsForSubcategory = grouped[categoryKey] || [];

        if (!productsForSubcategory.length) continue;

        renderedCategoryKeys.add(categoryKey);
        lineHtml += buildSubcategoryBlock(subcategory.nombre, productsForSubcategory);
      }

      const remainingBlocks = Object.entries(grouped)
        .filter(([key, items]) => items?.length && !renderedCategoryKeys.has(key))
        .sort((a, b) => a[0].localeCompare(b[0], "es"))
        .map(([_, items]) =>
          buildSubcategoryBlock(items[0]?.categoria || "Otras subcategorías", items)
        );

      if (remainingBlocks.length) {
        lineHtml += remainingBlocks.join("");
      }

      lineHtml += `</section>`;
      html += lineHtml;
    }

    const remainingLinesMap = {};

    for (const product of productos) {
      const productLineCandidates = getLineCandidates(product.linea || "Otros");

      const alreadyRendered = productLineCandidates.some((candidate) =>
        renderedLineKeys.has(candidate)
      );

      if (alreadyRendered) continue;

      const lineKey = normalizeText(product.linea || "Otros");

      if (!remainingLinesMap[lineKey]) {
        remainingLinesMap[lineKey] = {
          nombre: product.linea || "Otros",
          items: []
        };
      }

      remainingLinesMap[lineKey].items.push(product);
    }

    Object.values(remainingLinesMap)
      .sort((a, b) => normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), "es"))
      .forEach((line) => {
        const grouped = groupProductsBySubcategory(sortProducts(line.items));

        html += `
          <section class="product-line-section">
            ${buildSectionHeader(line.nombre, slugify(line.nombre))}
        `;

        Object.entries(grouped)
          .sort((a, b) => a[0].localeCompare(b[0], "es"))
          .forEach(([_, items]) => {
            if (!items?.length) return;

            html += buildSubcategoryBlock(
              items[0]?.categoria || "Otras subcategorías",
              items
            );
          });

        html += `</section>`;
      });

    if (!html.trim()) {
      msg.textContent = "No se encontraron productos para mostrar.";
      msg.classList.remove("hidden");
      return;
    }

    grid.innerHTML = html;

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    }
  } catch (error) {
    console.error(error);
    msg.textContent = "No fue posible cargar el catálogo.";
    msg.classList.remove("hidden");
  }
});