import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Carousel from './carousel'
import TalleresSection from './talleres-section'
import MatriculasCallToAction from './matriculas-call-to-action'
import FAQSection from './faq-section'
import Footer from './footer'

export function LandingPage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = (location.state as any)?.scrollTo as string | undefined
    if (!state) return

    const normalize = (s?: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[?¿¡!.,;:\/\-]/g, '')
        .trim()

    const key = normalize(state)

    if (key === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.getElementById(key)
      if (el) {
        el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        // fallback: search headings/text using normalized comparison
        const headingSelectors = 'h1,h2,h3,h4,h5,section'
        const headings = Array.from(document.querySelectorAll<HTMLElement>(headingSelectors))
        const match = headings.find(h => normalize(h.textContent).includes(key))
        if (match) {
          match.setAttribute('tabindex', '-1')
          match.focus({ preventScroll: true })
          match.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    // clear state so future navigations don't re-trigger
    navigate(location.pathname, { replace: true, state: undefined })
  }, [location, navigate])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <Carousel />
      {/* <NewsCarousel /> */}
      <TalleresSection />
      <MatriculasCallToAction />
      <FAQSection />
      <Footer />
    </main>
  )
}
