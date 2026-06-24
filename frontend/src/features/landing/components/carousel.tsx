import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Shield, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import image4 from '@/assets/elements/image4.jpg';
import image5 from '@/assets/elements/image5.jpg';
import image6 from '@/assets/elements/image6.jpg';

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const slides = [
    {
      id: 1,
      title: 'Bienvenido a Mi casita',
      subtitle: 'Un espacio de amor, cuidado y aprendizaje',
      image: image4,
      tag: 'Cuidado Amoroso',
    },
    {
      id: 2,
      title: 'Desarrollo integral',
      subtitle: 'Estimulación temprana con profesionales calificados',
      image: image5,
      tag: 'Estimulación Temprana',
    },
    {
      id: 3,
      title: 'Crecimiento y felicidad',
      subtitle: 'Juntos creamos un futuro brillante para tus hijos',
      image: image6,
      tag: 'Aprendizaje Divertido',
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
  };

  const scrollToTalleres = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('talleres');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 py-16 md:py-24 lg:py-28 text-white">
      {/* Decorative Blob Background Elements */}
      <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -bottom-16 right-1/4 h-72 w-72 rounded-full bg-rose-500/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Welcoming Text & CTAs */}
          <div className="text-center lg:text-left lg:col-span-7 space-y-6 md:space-y-8 z-10">
            {/* Soft Playful Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-teal-100 shadow-sm mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              🏫 Bienvenidos a Mi casita
            </div>

            {/* Premium Hand-drawn Styled Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight text-balance">
              Un espacio de{' '}
              <span className="relative inline-block text-amber-300">
                amor
                <span className="absolute bottom-1 left-0 w-full h-2 bg-amber-500/20 -z-10 rounded-full" />
              </span>
              ,{' '}
              <span className="relative inline-block text-cyan-200">
                cuidado
                <span className="absolute bottom-1 left-0 w-full h-2 bg-cyan-400/20 -z-10 rounded-full" />
              </span>{' '}
              y{' '}
              <span className="relative inline-block text-teal-200">
                aprendizaje
                <span className="absolute bottom-1 left-0 w-full h-2 bg-teal-400/20 -z-10 rounded-full" />
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-teal-100/90 max-w-2xl leading-relaxed text-balance mx-auto lg:mx-0">
              Acompañamos el crecimiento feliz de tus pequeños con estimulación temprana guiada por profesionales apasionados en un entorno seguro y divertido.
            </p>

            {/* Playful CTAs */}
            <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
              <Link
                to="/admisiones/solicitud"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-bold text-slate-900 shadow-md shadow-amber-400/10 hover:bg-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Inscribirse ahora
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#talleres"
                onClick={scrollToTalleres}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/25 px-6 py-3.5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                Explorar talleres
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-white text-center lg:text-left">Estimulación</span>
                <span className="text-[10px] text-teal-200/80 leading-none text-center lg:text-left">Desarrollo integral</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-white text-center lg:text-left">Espacio Seguro</span>
                <span className="text-[10px] text-teal-200/80 leading-none text-center lg:text-left">Cuidado total</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-white text-center lg:text-left">Guía con Amor</span>
                <span className="text-[10px] text-teal-200/80 leading-none text-center lg:text-left">Educación especial</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sliding Image Collage */}
          <div className="relative lg:col-span-5 flex justify-center items-center z-10 mt-6 lg:mt-0">
            {/* Decorative organic squircle border */}
            <div className="relative h-64 w-64 min-[375px]:h-72 min-[375px]:w-72 sm:h-[350px] sm:w-[350px] md:h-[420px] md:w-[420px] rounded-[2.5rem] md:rounded-[4rem] border-8 border-white/20 bg-white/10 backdrop-blur-md p-4 shadow-xl overflow-hidden group">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-2 sm:inset-4 transition-all duration-1000 ease-in-out ${
                    index === currentSlide 
                      ? 'opacity-100 scale-100 rotate-0' 
                      : 'opacity-0 scale-95 -rotate-2 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover rounded-[1.8rem] md:rounded-[3rem] filter brightness-90"
                  />
                  {/* Floating slide badge inside frame */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-900/80 backdrop-blur-sm px-4 py-2 text-center text-white">
                    <span className="text-xs uppercase tracking-wider font-semibold text-teal-300">{slide.tag}</span>
                    <h3 className="text-sm font-bold truncate">{slide.subtitle}</h3>
                  </div>
                </div>
              ))}

              {/* Slider Nav Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow hover:bg-white transition hover:scale-105"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow hover:bg-white transition hover:scale-105"
                aria-label="Siguiente slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Floating absolute badge 1 */}
            <div className="absolute -left-6 top-8 rounded-2xl bg-slate-900/90 border border-white/10 p-3 shadow-lg hidden sm:flex items-center gap-2 animate-bounce-subtle text-white backdrop-blur">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="text-xs font-bold text-white">Juegos y Arte</p>
                <p className="text-[10px] text-teal-200">Creatividad sin límites</p>
              </div>
            </div>

            {/* Floating absolute badge 2 */}
            <div className="absolute -right-4 bottom-8 rounded-2xl bg-slate-900/90 border border-white/10 p-3 shadow-lg hidden sm:flex items-center gap-2 animate-bounce-subtle-delay text-white backdrop-blur">
              <span className="text-2xl">🧸</span>
              <div>
                <p className="text-xs font-bold text-white">Amigos Felices</p>
                <p className="text-[10px] text-teal-200">Socialización sana</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Decorative Wave Divider at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] md:h-[50px] fill-white">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,10.89,214.34-12.2V120H0V0C26.9,2.83,61.94,22.18,97,37.38,154.26,62.2,217.2,66.1,280,61.16,294,60,307.82,58.07,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
}
