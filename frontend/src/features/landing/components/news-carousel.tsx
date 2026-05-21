import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import heroImage from '../../../assets/hero.png';
import { getPublicNews, resolveNewsImageUrl, type NewsAnnouncement } from './news.api';

export default function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const items = await getPublicNews();
        if (!cancelled) {
          setNewsItems(items);
        }
      } catch (e) {
        if (!cancelled) {
          setNewsItems([]);
          setError(e instanceof Error ? e.message : 'No fue posible cargar las noticias');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNews();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (current >= newsItems.length) {
      setCurrent(0);
    }
  }, [current, newsItems.length]);

  useEffect(() => {
    if (!autoPlay || newsItems.length < 2) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % newsItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, newsItems.length]);

  const next = () => {
    if (newsItems.length === 0) {
      return;
    }
    setCurrent((prev) => (prev + 1) % newsItems.length);
    setAutoPlay(false);
  };

  const prev = () => {
    if (newsItems.length === 0) {
      return;
    }
    setCurrent((prev) => (prev - 1 + newsItems.length) % newsItems.length);
    setAutoPlay(false);
  };

  const activeItem = useMemo(() => newsItems[current] ?? null, [current, newsItems]);

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  };

  const excerpt = (text: string) => {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (clean.length <= 220) {
      return clean;
    }
    return `${clean.slice(0, 220).trim()}...`;
  };

  return (
    <section className="bg-gradient-to-b from-slate-50 to-orange-50/60 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h2 className="mb-2 text-4xl font-bold text-slate-900 md:text-5xl">Últimas noticias</h2>
          <div className="h-1 w-20 rounded-full bg-orange-500"></div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden shadow-xl"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {loading ? (
            <div className="flex h-96 items-center justify-center bg-gradient-to-br from-orange-100/60 via-white to-teal-50 md:h-[500px]">
              <div className="flex items-center gap-3 rounded-full border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                Cargando noticias...
              </div>
            </div>
          ) : newsItems.length > 0 && activeItem ? (
            <div className="relative h-96 bg-orange-100/40 md:h-[500px]">
              {newsItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === current ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={resolveNewsImageUrl(item.rutaImagen) || heroImage}
                    alt={item.titulo}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-10">
                    <p className="mb-2 text-sm text-orange-200 md:text-base">{formatDate(item.fechaPublicacion)}</p>
                    <h3 className="mb-3 text-2xl font-bold md:text-4xl">{item.titulo}</h3>
                    <p className="max-w-3xl text-base text-gray-100 md:text-lg">{excerpt(item.descripcion)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[420px] bg-slate-900 md:min-h-[500px] md:grid-cols-[1.1fr_0.9fr]">
              <div className="relative">
                <img src={heroImage} alt="Mi Casita" className="h-full w-full object-cover opacity-45" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-transparent" />
              </div>
              <div className="flex items-center justify-center p-8 text-white md:p-10">
                <div className="max-w-xl">
                  <p className="mb-2 text-sm uppercase tracking-[0.18em] text-orange-200">Noticias</p>
                  <h3 className="text-3xl font-bold md:text-5xl">{error ? 'No se pudieron cargar las noticias' : 'Aún no hay noticias publicadas'}</h3>
                  <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">
                    {error
                      ? 'Revisa la conexión con el backend o publica una noticia desde el panel administrativo.'
                      : 'Cuando publiques anuncios desde el dashboard, aparecerán aquí automáticamente.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {newsItems.length > 1 ? (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-orange-500/90 p-2 text-white transition-all duration-200 group hover:bg-orange-500 md:left-6 md:p-3"
              >
                <ChevronLeft className="h-6 w-6 transition group-hover:-translate-x-1 md:h-7 md:w-7" />
              </button>

              <button
                onClick={next}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-orange-500/90 p-2 text-white transition-all duration-200 group hover:bg-orange-500 md:right-6 md:p-3"
              >
                <ChevronRight className="h-6 w-6 transition group-hover:translate-x-1 md:h-7 md:w-7" />
              </button>
            </>
          ) : null}

          {newsItems.length > 1 ? (
            <>
              <div className="absolute bottom-10 left-4 right-4 z-10 flex items-center justify-between gap-4 px-2">
                <div className="flex gap-2 overflow-auto max-w-[65%]">
                  {newsItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrent(index)
                        setAutoPlay(false)
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-all whitespace-nowrap truncate ${
                        index === current
                          ? 'bg-orange-400 text-white underline decoration-white decoration-2'
                          : 'bg-white/20 text-white/80 hover:bg-white/40'
                      }`}
                      title={item.titulo}
                    >
                      {item.titulo.length > 28 ? `${item.titulo.slice(0, 28).trim()}...` : item.titulo}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/80">Siguiente</div>
                  <div className="max-w-xs truncate rounded bg-white/10 px-3 py-1 text-sm text-white">
                    {newsItems[(current + 1) % newsItems.length]?.titulo || ''}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-6 right-6 z-10 h-1">
                <div className="h-1 w-full rounded-full bg-white/20">
                  <div
                    className="h-1 rounded-full bg-orange-400 transition-all"
                    style={{ width: `${((current + 1) / newsItems.length) * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
