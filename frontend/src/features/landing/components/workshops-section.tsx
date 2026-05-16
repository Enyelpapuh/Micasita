import { useState, useEffect } from 'react';
import { Clock, Users, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import heroImage from '../../../assets/hero.png';

function formatCordobas(value: number) {
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(value) ? value : 0);
}

const workshops = [
  {
    id: 1,
    title: 'Estimulación Sensorial',
    description: 'Actividades diseñadas para potenciar todos los sentidos mediante experiencias sensoriales enriquecedoras.',
    schedule: 'Lunes a Viernes | 9:00 AM - 11:00 AM',
    ageGroup: '0 - 2 años',
    image: heroImage,
    status: 'open',
    color: 'from-amber-400 to-orange-400',
    price: 45000,
    duration: '4 semanas',
  },
  {
    id: 2,
    title: 'Motricidad Fina',
    description: 'Desarrollo de habilidades motoras finas a través de juegos interactivos y manipulación de objetos.',
    schedule: 'Martes y Jueves | 2:00 PM - 3:30 PM',
    ageGroup: '1 - 3 años',
    image: heroImage,
    status: 'open',
    color: 'from-rose-400 to-pink-400',
    price: 50000,
    duration: '4 semanas',
  },
  {
    id: 3,
    title: 'Lenguaje y Comunicación',
    description: 'Estimulación del lenguaje verbal y no verbal mediante canciones, cuentos y actividades interactivas.',
    schedule: 'Miércoles y Viernes | 10:00 AM - 11:30 AM',
    ageGroup: '1.5 - 3 años',
    image: heroImage,
    status: 'open',
    color: 'from-purple-400 to-indigo-400',
    price: 55000,
    duration: '4 semanas',
  },
  {
    id: 4,
    title: 'Musicoterapia',
    description: 'Exploración de sonidos y música como herramienta para el desarrollo cognitivo y emocional.',
    schedule: 'Lunes y Miércoles | 3:00 PM - 4:00 PM',
    ageGroup: '0 - 3 años',
    image: heroImage,
    status: 'open',
    color: 'from-cyan-400 to-blue-400',
    price: 48000,
    duration: '4 semanas',
  },
];

export default function WorkshopsSection() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % workshops.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % workshops.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + workshops.length) % workshops.length);
    setAutoPlay(false);
  };

  const getVisibleWorkshops = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(workshops[(current + i) % workshops.length]);
    }
    return visible;
  };

  return (
    <section className="bg-gradient-to-b from-white via-teal-50/30 to-slate-50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h2 className="mb-2 text-4xl font-bold text-slate-900 md:text-5xl">Nuestros talleres</h2>
          <div className="h-1 w-20 rounded-full bg-teal-600"></div>
          <p className="mt-4 text-lg text-slate-600">
            Descubre nuestros programas especializados diseñados para cada etapa del desarrollo
          </p>
        </div>

        {/* Workshops Carousel */}
        <div 
          className="relative mb-12"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {/* Carousel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getVisibleWorkshops().map((workshop) => (
              <div
                key={workshop.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                {/* Image */}
                <div className={`h-40 bg-gradient-to-br ${workshop.color} relative overflow-hidden`}>
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{workshop.title}</h3>
                  <p className="mb-4 flex-grow text-sm leading-relaxed text-slate-600">{workshop.description}</p>

                  {/* Info */}
                  <div className="mb-4 space-y-2 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span className="text-slate-600">{workshop.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span className="text-slate-600">{workshop.ageGroup}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Precio por mes:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-teal-700" />
                        <span className="text-lg font-bold text-teal-700">{formatCordobas(workshop.price)}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{workshop.duration}</p>
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-white bg-gradient-to-r ${workshop.color} hover:shadow-lg transform hover:scale-105`}
                  >
                    Inscribirse
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute -left-5 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-white p-2 md:p-3 rounded-full transition-all duration-200 group hidden md:flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-1 transition" />
          </button>

          <button
            onClick={next}
            className="absolute -right-5 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-primary/80 hover:bg-primary text-white p-2 md:p-3 rounded-full transition-all duration-200 group hidden md:flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-1 transition" />
          </button>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {workshops.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrent(index);
                  setAutoPlay(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'bg-teal-600 w-8'
                    : 'bg-slate-300 w-2 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}
