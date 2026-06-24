import FAQItem from './faq-items';
import { useNavigate } from 'react-router-dom';
import image1 from '@/assets/elements/image1.jpg';
import image2 from '@/assets/elements/image2.jpg';
import image3 from '@/assets/elements/image3.jpg';

type FaqEntry = {
  id: number;
  question: string;
  answer: string;
  image: string;
  imagePosition: 'left' | 'right';
};

export default function FAQSection() {
  const navigate = useNavigate();

  const faqs: FaqEntry[] = [
    {
      id: 1,
      question: '¿Qué es Mi casita?',
      answer:
        'Mi casita es un centro integral de estimulación temprana que proporciona un ambiente seguro y amoroso para el desarrollo de niños y niñas en sus primeros años de vida. Nuestro equipo de profesionales cualificados utiliza metodologías innovadoras para estimular todas las áreas del desarrollo: física, cognitiva, emocional y social.',
      image: image1,
      imagePosition: 'right'
    },
    {
      id: 2,
      question: '¿Qué se aprenderá?',
      answer:
        'En Mi casita, los niños desarrollan habilidades fundamentales a través de actividades lúdicas y experiencias significativas. Trabajamos en: motricidad fina y gruesa, lenguaje y comunicación, desarrollo cognitivo y concentración, inteligencia emocional, socialización y autonomía. Todo adaptado al ritmo individual de cada niño.',
      image: image2,
      imagePosition: 'left'
    },
    {
      id: 3,
      question: '¿Cómo puedo inscribirme?',
      answer:
        'El proceso es simple y pensado para brindarte comodidad. Primero agenda una visita guiada a nuestras instalaciones, luego presenta los documentos requeridos y completa el formulario de inscripción. Nuestro equipo te asesorará en cada paso del proceso y responderá todas tus preguntas sobre horarios, programas y valores. ¡Te esperamos!',
      image: image3,
      imagePosition: 'right'
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/30 relative">
      {/* Decorative Blob */}
      <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-teal-100/10 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Title */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">Preguntas Frecuentes</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Resolver tus Dudas
          </h2>
          <div className="mt-4 h-1.5 w-16 bg-teal-600 rounded-full mx-auto" />
          <p className="mt-4 text-base md:text-lg text-slate-600">
            Todo lo que necesitas saber sobre nuestro centro de estimulación temprana, metodologías de cuidado y actividades.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-20">
          {faqs.map((faq, index) => (
            <FAQItem key={faq.id} faq={faq} index={index} />
          ))}
        </div>

        {/* CTA Section - Rebranded as a friendly soft card */}
        <div className="mt-24 rounded-[2.5rem] border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-amber-50/40 p-8 md:p-14 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-teal-100/20 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-amber-100/20 -ml-10 -mb-10" />
          
          <div className="text-center relative z-10">
            <h3 className="mb-4 text-2xl font-extrabold text-slate-900 md:text-3xl tracking-tight">
              ¿Listo para conocernos en persona? 🏫
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-sm md:text-base text-slate-600 leading-relaxed">
              Agenda una visita guiada a nuestras instalaciones y descubre por qué tantas familias confían en Mi casita para el sano desarrollo de sus pequeños.
            </p>
            <button 
              onClick={() => navigate('/contacto')}
              className="rounded-2xl bg-teal-700 px-8 py-3.5 font-bold uppercase tracking-wider text-xs text-white shadow-md shadow-teal-700/10 hover:shadow-lg hover:scale-105 hover:bg-teal-600 transition-all duration-200"
            >
              Agendar Visita Guiada
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
