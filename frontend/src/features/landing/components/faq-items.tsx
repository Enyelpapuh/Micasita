interface FAQItemProps {
  faq: {
    id: number;
    question: string;
    answer: string;
    image: string;
    imagePosition: 'left' | 'right';
  };
  index: number;
}

export default function FAQItem({ faq }: FAQItemProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {/* Content Side */}
      <div
        className={`order-1 ${
          faq.imagePosition === 'right' ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <div className="w-full text-left">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
            {faq.question}
          </h3>
          <div className="w-12 h-1 bg-gradient-to-r from-teal-600 to-cyan-500 mb-6"></div>

          {/* Answer - Always visible */}
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>

      {/* Image Side */}
      <div
        className={`order-2 ${
          faq.imagePosition === 'right' ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg border-4 border-teal-200 hover:border-teal-300 transition">
          <img
            src={faq.image}
            alt={faq.question}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
