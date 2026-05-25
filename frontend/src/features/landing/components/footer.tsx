import { FiFacebook, FiInstagram } from 'react-icons/fi';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

function scrollToMatchingText(text: string) {
  const normalize = (s?: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[?¿¡!.,;:\/\-]/g, '')
      .trim()

  const target = normalize(text);

  if (target === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Prefer headings and section titles
  const headingSelectors = 'h1,h2,h3,h4,h5,section';
  const headings = Array.from(document.querySelectorAll<HTMLElement>(headingSelectors));

  const match = headings.find(el => normalize(el.textContent).includes(target));

  const doFocusAndScroll = (el: HTMLElement) => {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (match) {
    doFocusAndScroll(match);
    return;
  }

  // Fallback: search any element with matching text
  const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
  const fallback = all.find(el => normalize(el.textContent).includes(target));
  if (fallback) {
    doFocusAndScroll(fallback);
  }
}

export default function Footer() {
  const quickLinks = ['Inicio', '¿Qué es Mi casita?', 'Talleres', 'Noticias'];

  const navigate = useNavigate();

  function handleQuickLinkClick(e: MouseEvent, label: string) {
    e.preventDefault();

    if (['Talleres', 'Inicio', '¿Qué es Mi casita?', 'Noticias'].includes(label)) {
      const key = label === 'Inicio' ? 'inicio' : label === '¿Qué es Mi casita?' ? 'que es mi casita' : label.toLowerCase()
      navigate('/', { state: { scrollTo: key } })
      return
    }

    if (label === 'Noticias') {
      navigate('/')
      setTimeout(() => scrollToMatchingText('noticias'), 120)
      return
    }

    // small timeout to allow SPA route changes if needed
    setTimeout(() => scrollToMatchingText(label), 50);
  }

  function ContactButton() {
    const navigate = useNavigate();
    return (
      <button
        onClick={() => navigate('/contacto')}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
      >
        Enviar consulta
      </button>
    );
  }

  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">🏠</span>
              </div>
              <span className="font-bold text-xl">Mi casita</span>
            </div>
            <p className="text-sm opacity-80">
              Centro integral de estimulación temprana para el desarrollo de tus hijos
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Enlaces</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {quickLinks.map(link => (
                <li key={link}>
                  <a
                    href="#"
                    onClick={(e) => handleQuickLinkClick(e, link)}
                    className="hover:opacity-100 transition block"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA (navega a la vista de contacto) */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Contacto</h4>
            <p className="text-sm opacity-80 mb-4">¿Tienes una pregunta? Envíanos una consulta rápida.</p>
            <div>
              <ContactButton />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Síguenos</h4>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61554162104938"
                target="_blank"
                rel="noreferrer noopener"
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <FiFacebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/micasita.aj/"
                target="_blank"
                rel="noreferrer noopener"
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <FiInstagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm opacity-80">
              <p>&copy; 2024 Mi casita. Todos los derechos reservados.</p>

              <div className="flex items-center gap-6 mt-4 md:mt-0">
                {/* Duplicate Quick Links (same as in the column) */}
                <div className="hidden md:flex gap-4">
                  {quickLinks.map(link => (
                    <a
                      key={link}
                      href="#"
                      onClick={(e) => handleQuickLinkClick(e as unknown as MouseEvent, link)}
                      className="hover:opacity-100 transition"
                    >
                      {link}
                    </a>
                  ))}
                </div>

                {/* Policy links remain */}
                <div className="flex gap-6 md:gap-4">
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToMatchingText('Política de privacidad'); }} className="hover:opacity-100 transition">Política de privacidad</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); scrollToMatchingText('Términos de servicio'); }} className="hover:opacity-100 transition">Términos de servicio</a>
                </div>
              </div>
            </div>
        </div>
      </div>
    </footer>
  );
}
