import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, X } from 'lucide-react'
import { FiMenu } from 'react-icons/fi'
import logo from '../../assets/MiCASITALOGO-cropped.svg'
import { useAuth } from '../../features/auth/AuthContext'
import { getLandingAdmisionConfig } from '../../features/admision/admision.api'

function scrollToMatchingText(text: string) {
  const normalize = (s?: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[?¿¡!.,;:\/\-]/g, '')
      .trim()

  const target = normalize(text)

  if (target === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  const headingSelectors = 'h1,h2,h3,h4,h5,section'
  const headings = Array.from(document.querySelectorAll<HTMLElement>(headingSelectors))
  const match = headings.find(el => normalize(el.textContent).includes(target))

  const doFocusAndScroll = (el: HTMLElement) => {
    el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (match) {
    doFocusAndScroll(match)
    return
  }

  const all = Array.from(document.querySelectorAll<HTMLElement>('body *'))
  const fallback = all.find(el => normalize(el.textContent).includes(target))
  if (fallback) {
    doFocusAndScroll(fallback)
  }
}

const baseNavLinks = [
  { label: 'Inicio', to: '/' },
  { label: '¿Qué es Mi casita?', to: '/' },
  { label: 'Talleres', to: '/talleres' },
  { label: 'Noticias', to: '/' },
  { label: 'Conoce a nuestro equipo', to: '/equipo' },
  { label: 'Contacto', to: '/contacto' },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [admissionLinkVisible, setAdmissionLinkVisible] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  useEffect(() => {
    let cancelled = false

    const loadAdmissionStatus = async () => {
      try {
        const config = await getLandingAdmisionConfig()
        if (!cancelled) {
          setAdmissionLinkVisible(config.formularioActivo)
        }
      } catch {
        if (!cancelled) {
          setAdmissionLinkVisible(false)
        }
      }
    }

    loadAdmissionStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const navLinks = admissionLinkVisible
    ? [...baseNavLinks, { label: 'Admisión', to: '/admisiones/solicitud' }]
    : baseNavLinks

  const handleToggleMenu = () => {
    setIsMobileMenuOpen((previous) => !previous)
  }

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    handleCloseMenu()
    navigate('/', { replace: true })
  }

  const landingQuickLabels = ['Inicio', '¿Qué es Mi casita?', 'Talleres', 'Noticias']

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center" aria-label="Micasita">
          <img src={logo} alt="Micasita" className="h-10 w-auto" />
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              {landingQuickLabels.includes(link.label) ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (landingQuickLabels.includes(link.label)) {
                      const key = link.label === 'Inicio' ? 'inicio' : link.label === '¿Qué es Mi casita?' ? 'que es mi casita' : link.label.toLowerCase()
                      navigate('/', { state: { scrollTo: key } })
                    } else {
                      navigate(link.to)
                    }
                    handleCloseMenu()
                  }}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.to}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                {user?.nombre}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Ingresar
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleMenu}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200/70 bg-white md:hidden">
          <ul className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                {landingQuickLabels.includes(link.label) ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (landingQuickLabels.includes(link.label)) {
                        const key = link.label === 'Inicio' ? 'inicio' : link.label === '¿Qué es Mi casita?' ? 'que es mi casita' : link.label.toLowerCase()
                        navigate('/', { state: { scrollTo: key } })
                      } else {
                        navigate(link.to)
                      }
                      handleCloseMenu()
                    }}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.to}
                    onClick={handleCloseMenu}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="px-4 pb-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  onClick={handleCloseMenu}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={handleCloseMenu}
                className="block w-full rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
