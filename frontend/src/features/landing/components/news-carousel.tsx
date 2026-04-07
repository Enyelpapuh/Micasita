import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroImage from '../../../assets/hero.png';

const newsItems = [
  {
    id: 1,
    title: 'Iniciamos nuevo programa de estimulación sensorial',
    excerpt: 'Un programa innovador diseñado para potenciar todos los sentidos de nuestros pequeños.',
    image: heroImage,
    date: '15 de marzo, 2024',
  },
  {
    id: 2,
    title: 'Talleres de música para bebés',
    excerpt: 'Descubre cómo la música estimula el desarrollo cognitivo de los niños pequeños.',
    image: heroImage,
    date: '10 de marzo, 2024',
  },
  {
    id: 3,
    title: 'Evaluación del desarrollo infantil',
    excerpt: 'Conoce los avances y logros de tu hijo con nuestro programa de evaluación continua.',
    image: heroImage,
    date: '5 de marzo, 2024',
  },
];

export default function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % newsItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % newsItems.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + newsItems.length) % newsItems.length);
    setAutoPlay(false);
  };

  return (
    <section className="bg-gradient-to-b from-slate-50 to-orange-50/60 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h2 className="mb-2 text-4xl font-bold text-slate-900 md:text-5xl">Ultimas noticias</h2>
          <div className="h-1 w-20 rounded-full bg-orange-500"></div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden shadow-xl"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {/* Carousel Items */}
          <div className="relative h-96 bg-orange-100/40 md:h-[500px]">
            {newsItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === current ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                  <p className="mb-2 text-sm text-orange-200 md:text-base">{item.date}</p>
                  <h3 className="text-2xl md:text-4xl font-bold mb-3">{item.title}</h3>
                  <p className="text-base md:text-lg text-gray-100 max-w-2xl">{item.excerpt}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-orange-500/90 p-2 text-white transition-all duration-200 group hover:bg-orange-500 md:left-6 md:p-3"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-1 transition" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-orange-500/90 p-2 text-white transition-all duration-200 group hover:bg-orange-500 md:right-6 md:p-3"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-1 transition" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {newsItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrent(index);
                  setAutoPlay(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'bg-orange-400 w-8'
                    : 'bg-white/50 w-2 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
