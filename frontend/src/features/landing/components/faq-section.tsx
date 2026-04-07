import FAQItem from './faq-items';

type FaqEntry = {
  id: number;
  question: string;
  answer: string;
  image: string;
  imagePosition: 'left' | 'right';
};

export default function FAQSection() {
  const faqs: FaqEntry[] = [
    {
      id: 1,
      question: '¿Qué es Mi casita?',
      answer:
        'Mi casita es un centro integral de estimulación temprana que proporciona un ambiente seguro y amoroso para el desarrollo de niños y niñas en sus primeros años de vida. Nuestro equipo de profesionales cualificados utiliza metodologías innovadoras para estimular todas las áreas del desarrollo: física, cognitiva, emocional y social.',
      image: '/favicon.svg',
      imagePosition: 'right'
    },
    {
      id: 2,
      question: '¿Qué se aprenderá?',
      answer:
        'En Mi casita, los niños desarrollan habilidades fundamentales a través de actividades lúdicas y experiencias significativas. Trabajamos en: motricidad fina y gruesa, lenguaje y comunicación, desarrollo cognitivo y concentración, inteligencia emocional, socialización y autonomía. Todo adaptado al ritmo individual de cada niño.',
      image: '/favicon.svg',
      imagePosition: 'left'
    },
    {
      id: 3,
      question: '¿Cómo puedo inscribirme?',
      answer:
        'El proceso es simple y pensado para brindarte comodidad. Primero agenda una visita guiada a nuestras instalaciones, luego presenta los documentos requeridos y completa el formulario de inscripción. Nuestro equipo te asesorará en cada paso del proceso y responderá todas tus preguntas sobre horarios, programas y valores. ¡Te esperamos!',
      image: '/favicon.svg',
      imagePosition: 'right'
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Todo lo que necesitas saber sobre nuestro centro de estimulación temprana
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-12">
          {faqs.map((faq, index) => (
            <FAQItem key={faq.id} faq={faq} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 md:p-12">
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl">
              ¿Listo para conocernos?
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
              Agenda una visita y descubre por qué las familias confían en Mi casita para el desarrollo de sus hijos
            </p>
            <button className="rounded-lg bg-teal-700 px-8 py-3 font-semibold text-white transition hover:scale-105 hover:bg-teal-600">
              Agendar Visita
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
