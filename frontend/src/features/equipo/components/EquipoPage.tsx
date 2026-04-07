import heroImage from '../../../assets/hero.png'

type ProfileCardProps = {
  imageSrc?: string
  initials: string
  name: string
  title: string
  description: string
  email: string
}

function ProfileImage({ imageSrc, initials, name }: Pick<ProfileCardProps, 'imageSrc' | 'initials' | 'name'>) {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={`Foto de perfil de ${name}`}
        className="h-full w-full object-cover transition duration-500 hover:scale-105"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-teal-50 text-3xl font-semibold text-slate-500">
      {initials}
    </div>
  )
}

function ProfileCard({ imageSrc, initials, name, title, description, email }: ProfileCardProps) {
  return (
    <section className="mx-auto my-8 max-w-4xl rounded-2xl bg-white p-6 shadow-2xl transition-shadow duration-300 hover:shadow-xl md:p-8">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div className="h-36 w-36 flex-shrink-0 overflow-hidden rounded-full border-4 border-teal-500/70 shadow-lg md:h-48 md:w-48">
          <ProfileImage imageSrc={imageSrc} initials={initials} name={name} />
        </div>

        <div className="text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-slate-800 md:text-4xl">{name}</h2>
          <h3 className="mb-3 text-lg font-semibold text-teal-700 md:text-xl">{title}</h3>
          <p className="mb-4 italic leading-relaxed text-slate-600">"{description}"</p>
          <p className="text-sm font-medium text-slate-500">
            Correo: <span className="text-teal-600">{email}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-700">{title}</h2>
      </div>
    </section>
  )
}

type TeamMember = ProfileCardProps & {
  sectionTitle: string
}

const teamMembers: TeamMember[] = [
  {
    sectionTitle: 'Director Administrativo',
    imageSrc: heroImage,
    initials: 'OR',
    name: 'Oscar Rodríguez',
    title: 'Lic. en Matemáticas',
    description:
      'Mi pasión por la enseñanza comenzó desde que estaba en la secundaria. Después de 44 años sigo impartiendo clases con la misma ilusión, promoviendo una metodología fácil y divertida. Mi misión se cumple al ver el gozo en la cara de mis alumnos.',
    email: 'algo.....@gmail.com',
  },
  {
    sectionTitle: 'Educadora y CEO',
    initials: 'ER',
    name: 'Eliett Rodríguez',
    title: 'Lic. en Sociología',
    description:
      'Mi prioridad es fomentar y visualizar la importancia de la atención y estimulación en la primera infancia, porque allí podemos potenciar el desarrollo máximo de capacidades de cada bebé sin obviar las características únicas que poseen.',
    email: 'algo.....@gmail.com',
  },
  {
    sectionTitle: 'Educadora y Psicóloga',
    initials: 'GR',
    name: 'Gema Rodríguez',
    title: 'Lic. en Sociología',
    description:
      'Para mí educar sin amor y empatía es imposible. Cuando respetamos, nos informamos y comprendemos las diversidades de aprendizaje, facilitamos el desarrollo y la autoestima de cada niño y niña que llega a nosotros.',
    email: 'algo.....@gmail.com',
  },
]

export function EquipoPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 pb-20 pt-12">
      <section className="mx-auto max-w-4xl px-4 pb-8 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Conoce a nuestro equipo</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Un equipo cercano, humano y enfocado en ayudarte a encontrar tu lugar ideal.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          La confianza se construye con acompañamiento real, claridad en cada paso y atención a los detalles que importan.
        </p>
      </section>

      <div className="space-y-12">
        {teamMembers.map((member) => (
          <div key={member.name}>
            <SectionTitle title={member.sectionTitle} />
            <ProfileCard {...member} />
          </div>
        ))}
      </div>
    </main>
  )
}
