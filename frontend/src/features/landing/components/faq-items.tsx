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
  const isRightImage = faq.imagePosition === 'right';
  const rotationClass = faq.id % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1';

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
      {/* Content Side */}
      <div
        className={`order-1 ${
          isRightImage ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <div className="w-full text-left space-y-4">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {faq.question}
          </h3>
          
          {/* Dotted/Dash Custom Playful Divider */}
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-12 h-1.5 rounded-full bg-teal-600"></div>
            <div className="w-3 h-1.5 rounded-full bg-amber-400"></div>
          </div>

          {/* Answer - Always visible */}
          <p className="text-base md:text-lg text-slate-600 leading-relaxed text-balance">
            {faq.answer}
          </p>
        </div>
      </div>

      {/* Image Side - Styled like a sweet photo frame */}
      <div
        className={`order-2 ${
          isRightImage ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <div className={`relative h-64 md:h-80 rounded-[2rem] overflow-hidden shadow-lg border-[8px] border-white ring-4 ring-teal-200/40 transition-all duration-300 ${rotationClass}`}>
          <img
            src={faq.image}
            alt={faq.question}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
