import { Mail, Phone, MapPin } from 'lucide-react';
import { FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
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
              <li><a href="#" className="hover:opacity-100 transition">Inicio</a></li>
              <li><a href="#" className="hover:opacity-100 transition">¿Qué es Mi casita?</a></li>
              <li><a href="#" className="hover:opacity-100 transition">Programas</a></li>
              <li><a href="#" className="hover:opacity-100 transition">Contacto</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 opacity-80">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Mail size={16} />
                <span>info@micasita.com</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <MapPin size={16} />
                <span>Calle Principal 123</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Síguenos</h4>
            <div className="flex gap-4">
              <a href="#" className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                <FiInstagram size={20} />
              </a>
              <a href="#" className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                <FiLinkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm opacity-80">
            <p>&copy; 2024 Mi casita. Todos los derechos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:opacity-100 transition">Política de privacidad</a>
              <a href="#" className="hover:opacity-100 transition">Términos de servicio</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
