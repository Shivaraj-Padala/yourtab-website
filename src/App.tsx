import { Faq, FinalCta, Footer, Privacy } from './components/Bottom'
import { Customize } from './components/Customize'
import { FaceSection } from './components/FaceSection'
import { Features } from './components/Features'
import { Specs } from './components/Specs'
import { Statement } from './components/Statement'
import { Hero, Nav, TrustStrip } from './components/Top'
import { useReveal } from './lib/motion'

export default function App() {
  useReveal()
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Statement />
        <Features />
        <Specs />
        <Customize />
        <FaceSection />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
