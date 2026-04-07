import { useEffect } from 'react'
import toast from 'react-hot-toast'
import Carousel from './carousel'
import NewsCarousel from './news-carousel'
import WorkshopsSection from './workshops-section'
import MatriculasSection from './matriculas-section'
import FAQSection from './faq-section'
import Footer from './footer'

export function LandingPage() {
  useEffect(() => {
    toast.success('Bienvenido a Micasita', {
      id: 'landing-welcome',
    })
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <Carousel />
      <NewsCarousel />
      <WorkshopsSection />
      <MatriculasSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
