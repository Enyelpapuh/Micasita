import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      color: 'from-teal-700/90 to-cyan-600/90',
      image: image4,
    },
    {
      id: 2,
      title: 'Desarrollo integral',
      subtitle: 'Estimulación temprana con profesionales calificados',
      color: 'from-orange-500/90 to-amber-500/90',
      image: image5,
    },
    {
      id: 3,
      title: 'Crecimiento y felicidad',
      subtitle: 'Juntos creamos un futuro brillante para tus hijos',
      color: 'from-blue-600/90 to-teal-700/90',
      image: image6,
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
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

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-none">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`bg-gradient-to-r ${slide.color} w-full h-full flex items-center justify-center`}>
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
              <img 
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{slide.title}</h1>
              <p className="text-xl md:text-2xl text-white/90 text-balance">{slide.subtitle}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 transition"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6 text-slate-800" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 transition"
        aria-label="Siguiente slide"
      >
        <ChevronRight className="w-6 h-6 text-slate-800" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === currentSlide
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
