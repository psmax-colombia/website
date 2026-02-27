// /scripts/main.js

document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     APLICAR AJUSTES DEL SITIO (site.json)
     ========================= */
  function applySettings(s) {
    if (!s) return;

    // Logo header
    const logoEl = document.getElementById('siteLogo');
    if (logoEl && s.logo) logoEl.src = s.logo;

    // Sección experiencia
    const expLogo = document.getElementById('imgExperiencia');
    const expInner = document.getElementById('expInner');

    if (expLogo) {
      if (s.imgExperiencia) expLogo.src = s.imgExperiencia;

      const h = Number(s.imgExperienciaHeight);
      if (!Number.isNaN(h) && h > 0) {
        expLogo.style.height = `${h}px`;
        expLogo.style.width = 'auto';
      } else {
        expLogo.style.removeProperty('height');
        expLogo.style.removeProperty('width');
      }

      const gap = Number(s.imgExperienciaGap);
      if (!Number.isNaN(gap) && gap >= 0) {
        expLogo.style.marginBottom = `${gap}px`;
      } else {
        expLogo.style.removeProperty('margin-bottom');
      }
    }
    // Texto de experiencia
      const expText = document.getElementById('experienceText');
      if (expText && s.experienceText) {
        expText.textContent = s.experienceText;
      }
      
      // (opcional) alineación
      if (expInner && s.imgExperienciaAlign) {
        expInner.classList.remove('text-left', 'text-center', 'text-right');
        if (s.imgExperienciaAlign === 'left') expInner.classList.add('text-left');
        if (s.imgExperienciaAlign === 'center') expInner.classList.add('text-center');
        if (s.imgExperienciaAlign === 'right') expInner.classList.add('text-right');
      }

    if (expInner) expInner.classList.add('flex', 'flex-col', 'items-center');

    // Home: tarjetas (líneas)
    if (s.productLines) renderProductLines(s.productLines);

    // Home: título sección servicios
    const productTitleEl = document.getElementById('serviceSectionTitle');
    if (productTitleEl) {
      productTitleEl.textContent = s.serviceSectionTitle || 'Nuestros Productos';
    }

    // WhatsApp + mensaje
    if (s.whatsapp) {
      const phone = String(s.whatsapp).replace(/\D/g, '');
      const msg = (s.whatsappMessage || '').trim();
      const waUrl = `https://wa.me/${phone}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;

      const waFloat = document.getElementById('waFloating');
      if (waFloat) waFloat.href = waUrl;

      const waBtn = document.getElementById('whatsappBtn');
      if (waBtn) waBtn.href = waUrl;

      const menuContact = document.getElementById('menuContact');
      if (menuContact) {
        menuContact.href = waUrl;
        menuContact.target = '_blank';
        menuContact.rel = 'noopener';
      }
    }

    if (s.email) { const el = document.getElementById('contactEmail'); if (el) el.textContent = s.email; }
    if (s.phone) { const el = document.getElementById('contactPhone'); if (el) el.textContent = s.phone; }
    if (s.address) { const el = document.getElementById('contactAddress'); if (el) el.textContent = s.address; }

    // Redes Sociales
    const fb = document.getElementById('socialFacebook');
    if (fb) {
      if (s.socialFacebook) { fb.href = s.socialFacebook; fb.classList.remove('hidden'); }
      else fb.classList.add('hidden');
    }

    const ig = document.getElementById('socialInstagram');
    if (ig) {
      if (s.socialInstagram) { ig.href = s.socialInstagram; ig.classList.remove('hidden'); }
      else ig.classList.add('hidden');
    }

    const ln = document.getElementById('socialLinkedin');
    if (ln) {
      if (s.socialLinkedin) { ln.href = s.socialLinkedin; ln.classList.remove('hidden'); }
      else ln.classList.add('hidden');
    }

        // Footer: Copyright dinámico (con año automático)
    const foot = document.getElementById('footerCopyright');
    if (foot && s.footerCopyright) {
      const year = new Date().getFullYear();
      foot.textContent = String(s.footerCopyright).replace('{year}', year);
    }
        // Sección Contáctanos: color de fondo dinámico
    const contactSection = document.getElementById('contacto');
    if (contactSection && s.contactBgColor) {
      contactSection.style.backgroundColor = s.contactBgColor;
      // si quieres, forzamos texto blanco por seguridad
      contactSection.style.color = '#fff';
    }
  }

  /* =========================
     NOSOTROS (nosotros.json)
     ========================= */
  function applyNosotros(n) {
    if (!n) return;

    const aboutTitleEl = document.getElementById('aboutTitle');
    if (aboutTitleEl && n.aboutTitle) aboutTitleEl.textContent = n.aboutTitle;

    const aboutImgEl = document.getElementById('aboutImage');
    if (aboutImgEl && n.aboutImage) aboutImgEl.src = n.aboutImage;

    const aboutText1El = document.getElementById('aboutText1');
    if (aboutText1El && n.aboutText1) aboutText1El.textContent = n.aboutText1;

    const aboutText2El = document.getElementById('aboutText2');
    if (aboutText2El && n.aboutText2) aboutText2El.textContent = n.aboutText2;

    const missionTitleEl = document.getElementById('missionTitle');
    if (missionTitleEl && n.missionTitle) missionTitleEl.textContent = n.missionTitle;

    const missionTextEl = document.getElementById('missionText');
    if (missionTextEl && n.missionText) missionTextEl.textContent = n.missionText;

    const visionTitleEl = document.getElementById('visionTitle');
    if (visionTitleEl && n.visionTitle) visionTitleEl.textContent = n.visionTitle;

    const visionTextEl = document.getElementById('visionText');
    if (visionTextEl && n.visionText) visionTextEl.textContent = n.visionText;

    const valuesTitleEl = document.getElementById('valuesTitle');
    if (valuesTitleEl && n.valuesTitle) valuesTitleEl.textContent = n.valuesTitle;

    const valuesListEl = document.getElementById('valuesList');
    if (valuesListEl && Array.isArray(n.valuesItems)) {
      valuesListEl.innerHTML = n.valuesItems
        .map(v => `<li>✔ ${v.item || ''}</li>`)
        .join('');
    }
  }

  /* =========================
     SLIDER (Tiny Slider)
     ========================= */
  function slideHTML(slide) {
    const t = slide.title || '';
    const st = slide.subtitle || '';
    const cta = slide.ctaLabel
      ? `<a href="${slide.ctaHref || '#'}"
             class="mt-8 inline-block px-5 py-3 rounded-xl
                    border-2 border-primary-600 text-primary-600 bg-white/90
                    hover:bg-primary-600 hover:text-white hover:border-primary-700
                    font-medium shadow-sm ring-1 ring-black/5 transition">
            ${slide.ctaLabel}
          </a>`
      : '';
    return `
      <div class="relative h-[360px] md:h-[520px]">
        <img src="${slide.image}" alt="${t}" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-slate-900/50"></div>
        <div class="relative container mx-auto px-4 py-20 md:py-32 text-white">
          ${t ? `<h2 class="text-3xl md:text-5xl font-bold max-w-3xl">${t}</h2>` : ''}
          ${st ? `<p class="mt-4 max-w-2xl text-slate-200">${st}</p>` : ''}
          ${cta}
        </div>
      </div>`;
  }

  function ensureTinySlider(fn, slides, retries = 10) {
    if (typeof window.tns === 'function') fn(slides);
    else if (retries > 0) setTimeout(() => ensureTinySlider(fn, slides, retries - 1), 150);
    else console.warn('tiny-slider no cargó a tiempo.');
  }

  function initSlider(slides) {
    const container = document.getElementById('heroSlider');
    if (!container) return;
    if (!Array.isArray(slides) || slides.length === 0) return;

    container.innerHTML = slides.map(slideHTML).join('');

    if (window.heroSliderInstance?.destroy) window.heroSliderInstance.destroy();

    window.heroSliderInstance = tns({
      container: '#heroSlider',
      items: 1,
      autoplay: true,
      autoplayTimeout: 4000,
      autoplayButtonOutput: false,
      controls: false,
      nav: true,
      mouseDrag: true,
      loop: true,
      speed: 600,
      mode: 'gallery'
    });
  }

  /* =========================
     HOME: LÍNEAS DE SERVICIOS
     ========================= */
  function renderProductLines(lines) {
    const container = document.getElementById('productLinesContainer');
    if (!container || !Array.isArray(lines) || lines.length === 0) return;

    container.innerHTML = lines.map(line => {
      const baseLink = line.link || 'productos.html';
      const href = line.anchor ? `${baseLink}#${line.anchor}` : baseLink;

      return `
        <a href="${href}"
           class="block bg-white rounded-2xl border border-primary-100 hover:border-primary-200 hover:shadow-md transition overflow-hidden">
          <div class="px-6 pt-5">
            <h3 class="font-semibold text-primary-800">${line.title || ''}</h3>
          </div>

          ${line.image ? `
            <div class="px-6 mt-3">
              <img src="${line.image}" alt="${line.title || ''}"
                   class="w-full h-36 md:h-40 object-cover rounded-xl border border-primary-50" />
            </div>` : ''}

          <div class="p-6">
            <p class="text-sm text-slate-600 leading-relaxed">${line.description || ''}</p>
          </div>
        </a>
      `;
    }).join('');
  }

  /* =========================
     CARGAR site.json
     ========================= */
  async function loadSettings() {
    try {
      const res = await fetch('/content/site.json', { cache: 'no-store' });
      if (!res.ok) return;
      const s = await res.json();
      window.__site = s;
      applySettings(s);
      ensureTinySlider(initSlider, s.heroSlides || []);
    } catch (e) {
      console.error('Error cargando site.json', e);
    }
  }

  /* =========================
     CARGAR nosotros.json (solo si existe sección)
     ========================= */
  async function loadNosotrosContent() {
    // Solo ejecutar en nosotros.html (si existen los IDs)
    if (!document.getElementById('aboutTitle')) return;

    try {
      const res = await fetch('/content/nosotros.json', { cache: 'no-store' });
      if (!res.ok) return;
      const n = await res.json();
      window.__nosotros = n;
      applyNosotros(n);
    } catch (e) {
      console.error('Error cargando nosotros.json', e);
    }
  }

  loadSettings();
  loadNosotrosContent();

  /* =========================
     MENÚ MÓVIL
     ========================= */
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('hidden');
  });

  /* =========================
     MENÚ "NUESTROS PRODUCTOS" (desktop)
     ========================= */
  (function () {
    const root = document.getElementById('productsMenu');
    const btn = document.getElementById('productsBtn');
    const panel = document.getElementById('productsPanel');
    if (!root || !btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      panel.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) panel.classList.add('hidden');
    });
  })();
});