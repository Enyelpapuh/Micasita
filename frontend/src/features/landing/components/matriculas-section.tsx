import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Calendar, Users, ChevronRight, X } from 'lucide-react';

const ageGroups = [
  {
    id: 1,
    name: 'Lactantes',
    ageRange: '0-12 meses',
    capacity: '8-10 niños',
    description: 'Cuidado especializado con estimulación temprana desde el nacimiento',
    color: 'from-rose-400 to-pink-500',
    lightColor: 'bg-rose-50',
  },
  {
    id: 2,
    name: 'Maternales',
    ageRange: '1-2 años',
    capacity: '10-12 niños',
    description: 'Desarrollo motriz y cognitivo con actividades interactivas',
    color: 'from-amber-400 to-orange-500',
    lightColor: 'bg-amber-50',
  },
  {
    id: 3,
    name: 'Pre-Kínder',
    ageRange: '2-3 años',
    capacity: '12-14 niños',
    description: 'Socialización y preparación para educación formal',
    color: 'from-emerald-400 to-teal-500',
    lightColor: 'bg-emerald-50',
  },
  {
    id: 4,
    name: 'Kínder',
    ageRange: '3-4 años',
    capacity: '14-16 niños',
    description: 'Aprendizaje estructurado y desarrollo integral',
    color: 'from-blue-400 to-cyan-500',
    lightColor: 'bg-blue-50',
  },
];

export default function MatriculasSection() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    childAge: '',
    email: '',
    phone: '',
    preferredDate: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Entrevista agendada:', formData);
    alert('¡Entrevista agendada exitosamente! Nos contactaremos pronto.');
    setFormData({ parentName: '', childName: '', childAge: '', email: '', phone: '', preferredDate: '' });
    setShowForm(false);
  };

  return (
    <section className="bg-gradient-to-b from-slate-100 to-white px-4 py-16 md:px-6 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Matrículas de Preescolar 2026
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Descubre nuestros programas educativos diseñados para cada etapa del desarrollo de tu hijo
          </p>
        </div>

        {/* Age Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {ageGroups.map(group => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
              className={`relative p-6 rounded-xl transition-all duration-300 cursor-pointer transform ${
                selectedGroup === group.id
                  ? `scale-105 shadow-xl ${group.lightColor} border-2 border-current`
                  : `${group.lightColor} hover:shadow-lg border border-transparent hover:border-current/20`
              }`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${group.color}`}></div>

              <h3 className="mb-2 text-xl font-bold text-slate-900">{group.name}</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{group.ageRange}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{group.capacity}</span>
                </div>
              </div>

              <p className="mb-4 text-left text-sm text-slate-600">
                {group.description}
              </p>

              {selectedGroup === group.id && (
                <div className="mt-4 pt-4 border-t border-muted/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowForm(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 font-semibold text-white transition hover:shadow-lg"
                  >
                    Agenda tu entrevista
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enrollment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Agenda tu Entrevista
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 transition hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Nombre del apoderado
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Nombre del niño/a
                  </label>
                  <input
                    type="text"
                    name="childName"
                    value={formData.childName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="Nombre del niño/a"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Edad del niño/a
                  </label>
                  <input
                    type="text"
                    name="childAge"
                    value={formData.childAge}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="Ej: 2 años, 18 meses"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Fecha preferida para entrevista
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 font-semibold text-white transition hover:shadow-lg"
                  >
                    Confirmar Entrevista
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
