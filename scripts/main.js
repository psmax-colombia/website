// /scripts/main.js

// Espera al DOM
document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     APLICAR AJUSTES DEL SITIO
     ========================= */
  function applySettings(s) {
    if (!s) return;

    // Logo header
    const logoEl = document.getElementById('siteLogo');
    if (logoEl && s.logo) logoEl.src = s.logo;

    // Sección experiencia
     const expLogo  = document.getElementById('imgExperiencia');
     const expInner = document.getElementById('expInner');
     
     if (expLogo) {
       // Imagen
       if (s.imgExperiencia) expLogo.src = s.imgExperiencia;
     
       // Alto personalizado (px)
       const h = Number(s.imgExperienciaHeight);
       if (!Number.isNaN(h) && h > 0) {
         expLogo.style.height = `${h}px`;
         expLogo.style.width  = 'auto';
       } else {
         expLogo.style.removeProperty('height');
         expLogo.style.removeProperty('width');
       }
     
       // Separación inferior (px)
       const gap = Number(s.imgExperienciaGap);
       if (!Number.isNaN(gap) && gap >= 0) {
         expLogo.style.marginBottom = `${gap}px`;
       } else {
         expLogo.style.removeProperty('margin-bottom');
       }
     }
     
     // (opcional) asegurar layout para futuras alineaciones
     if (expInner) {
       expInner.classList.add('flex','flex-col','items-center');
     }
     // Cargar panel de administracion Seccion NUESTROS PRODUCTOS
     if (s.productLines) renderProductLines(s.productLines);
     

     // Contacto/WhatsApp (desde site.json + mensaje configurable)
      if (s.whatsapp) {
        const phone = String(s.whatsapp).replace(/\D/g, ''); // deja solo números
        const msg   = (s.whatsappMessage || '').trim();
        const waUrl = `https://wa.me/${phone}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
      
        // Botón flotante
        const waFloat = document.getElementById('waFloating');
        if (waFloat) waFloat.href = waUrl;
      
        // Botón en sección contacto (si existe)
        const waBtn = document.getElementById('whatsappBtn');
        if (waBtn) waBtn.href = waUrl;
      
        // Menú "Contáctanos" -> abrir WhatsApp
        const menuContact = document.getElementById('menuContact');
        if (menuContact) {
          menuContact.href = waUrl;
          menuContact.target = '_blank';
          menuContact.rel = 'noopener';
        }
      }

    if (s.email)  { const el = document.getElementById('contactEmail');  if (el) el.textContent = s.email; }
    if (s.phone)  { const el = document.getElementById('contactPhone');  if (el) el.textContent = s.phone; }
    if (s.address){ const el = document.getElementById('contactAddress');if (el) el.textContent = s.address; }
    // redes sociales
        // =========================
    // Redes Sociales
    // =========================

    const fb = document.getElementById("socialFacebook");
    if (fb) {
      if (s.socialFacebook) {
        fb.href = s.socialFacebook;
        fb.classList.remove("hidden");
      } else {
        fb.classList.add("hidden");
      }
    }

    const ig = document.getElementById("socialInstagram");
    if (ig) {
      if (s.socialInstagram) {
        ig.href = s.socialInstagram;
        ig.classList.remove("hidden");
      } else {
        ig.classList.add("hidden");
      }
    }

    const ln = document.getElementById("socialLinkedin");
    if (ln) {
      if (s.socialLinkedin) {
        ln.href = s.socialLinkedin;
        ln.classList.remove("hidden");
      } else {
        ln.classList.add("hidden");
      }
    }

  }

  /* =========================
     SLIDER (Tiny Slider)
     ========================= */
  function slideHTML(slide) {
    const t   = slide.title || '';
    const st  = slide.subtitle || '';
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
          ${t  ? `<h2 class="text-3xl md:text-5xl font-bold max-w-3xl">${t}</h2>` : ''}
          ${st ? `<p class="mt-4 max-w-2xl text-slate-200">${st}</p>` : ''}
          ${cta}
        </div>
      </div>`;
  }

  function ensureTinySlider(fn, slides, retries = 10) {
    // Espera a que la función tns esté disponible
    if (typeof window.tns === 'function') {
      fn(slides);
    } else if (retries > 0) {
      setTimeout(() => ensureTinySlider(fn, slides, retries - 1), 150);
    } else {
      console.warn('tiny-slider no cargó a tiempo.');
    }
  }

  function initSlider(slides) {
    const container = document.getElementById('heroSlider');
    if (!container) return;
    if (!Array.isArray(slides) || slides.length === 0) return;

    container.innerHTML = slides.map(slideHTML).join('');

    if (window.heroSliderInstance?.destroy) window.heroSliderInstance.destroy();

    // Inicializa tiny-slider (dots por defecto; CSS los posiciona)
    window.heroSliderInstance = tns({
      container: '#heroSlider',
      items: 1,
      autoplay: true,
      autoplayTimeout: 4000,
      autoplayButtonOutput: false,
      controls: false,
      nav: true,        // dots activos
      mouseDrag: true,
      loop: true,
      speed: 600,
      mode: 'gallery'   // fade suave
    });
  }

  /* =========================
   NUESTROS PRODUCTOS (Home)
   ========================= */
function renderProductLines(lines) {
  const container = document.getElementById("productLinesContainer");
  if (!container || !Array.isArray(lines) || lines.length === 0) return;

  container.innerHTML = lines.map(line => {
    // URL base: lo que venga del JSON o, por defecto, productos.html
    const baseLink = line.link || "productos.html";

    // Si el JSON trae anchor, armamos productos.html#anchor
    const href = line.anchor ? `${baseLink}#${line.anchor}` : baseLink;

    return `
      <a href="${href}"
         class="block bg-white rounded-2xl border border-primary-100 hover:border-primary-200 hover:shadow-md transition overflow-hidden">
        <!-- Título -->
        <div class="px-6 pt-5">
          <h3 class="font-semibold text-primary-800">${line.title || ''}</h3>
        </div>

        <!-- Imagen -->
        ${line.image ? `
          <div class="px-6 mt-3">
            <img src="${line.image}" alt="${line.title || ''}"
                 class="w-full h-36 md:h-40 object-cover rounded-xl border border-primary-50" />
          </div>` : ''}

        <!-- Descripción -->
        <div class="p-6">
          <p class="text-sm text-slate-600 leading-relaxed">${line.description || ''}</p>
        </div>
      </a>
    `;
  }).join('');
}
  /* =========================
     CARGAR SETTINGS (site.json)
     ========================= */
  async function loadSettings() {
    try {
      const res = await fetch('content/site.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const s = await res.json();
      window.__site = s;
      applySettings(s);
      // Asegura tiny-slider y luego crea el carrusel
      ensureTinySlider(initSlider, s.heroSlides || []);
    } catch (e) {
      console.error('Error cargando site.json', e);
    }
  }

  loadSettings();

  /* =========================
     MENÚ MÓVIL (hamburguesa)
     ========================= */
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('hidden');
  });

  /* =========================
     MENÚ "NUESTROS PRODUCTOS" (desktop)
     ========================= */
  (function(){
    const root  = document.getElementById('productsMenu');
    const btn   = document.getElementById('productsBtn');
    const panel = document.getElementById('productsPanel');
    if (!root || !btn || !panel) return;

    // Toggle por clic (útil en pantallas táctiles)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      panel.classList.toggle('hidden');
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) panel.classList.add('hidden');
    });
  })();
});
