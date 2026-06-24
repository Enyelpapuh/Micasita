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
        className="rounded-xl bg-teal-600 hover:bg-teal-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        Enviar consulta
      </button>
    );
  }

  return (
    <footer className="relative bg-slate-900 text-slate-100 pt-16 mt-12">
      {/* Wave Transition Top */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-[0] transform -translate-y-[99%]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] md:h-[50px] fill-slate-900">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,10.89,214.34-12.2V120H0V0C26.9,2.83,61.94,22.18,97,37.38,154.26,62.2,217.2,66.1,280,61.16,294,60,307.82,58.07,321.39,56.44Z"></path>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-md">
                🏠
              </div>
              <span className="font-extrabold text-xl tracking-tight">Mi casita</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Centro integral de estimulación temprana. Un espacio de amor, cuidado y aprendizaje diseñado para la felicidad y desarrollo de tus hijos.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-extrabold mb-4 text-base uppercase tracking-wider text-teal-400">Enlaces</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {quickLinks.map(link => (
                <li key={link}>
                  <a
                    href="#"
                    onClick={(e) => handleQuickLinkClick(e, link)}
                    className="hover:text-white transition duration-200 block hover:translate-x-1 transform"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA */}
          <div>
            <h4 className="font-extrabold mb-4 text-base uppercase tracking-wider text-teal-400">Contacto</h4>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">¿Tienes alguna duda o quieres agendar una visita? Envíanos tu consulta.</p>
            <div>
              <ContactButton />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-extrabold mb-4 text-base uppercase tracking-wider text-teal-400">Síguenos</h4>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">Mantente al día con nuestras actividades diarias en redes sociales.</p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61554162104938"
                target="_blank"
                rel="noreferrer noopener"
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200"
                aria-label="Facebook"
              >
                <FiFacebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/micasita.aj/"
                target="_blank"
                rel="noreferrer noopener"
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200"
                aria-label="Instagram"
              >
                <FiInstagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Mi casita. Todos los derechos reservados.</p>

            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="hidden md:flex gap-4">
                {quickLinks.map(link => (
                  <a
                    key={link}
                    href="#"
                    onClick={(e) => handleQuickLinkClick(e as unknown as MouseEvent, link)}
                    className="hover:text-white transition duration-200"
                  >
                    {link}
                  </a>
                ))}
              </div>

              <div className="flex gap-4">
                <a href="#" onClick={(e) => { e.preventDefault(); scrollToMatchingText('Política de privacidad'); }} className="hover:text-white transition duration-200">Política de privacidad</a>
                <a href="#" onClick={(e) => { e.preventDefault(); scrollToMatchingText('Términos de servicio'); }} className="hover:text-white transition duration-200">Términos de servicio</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
