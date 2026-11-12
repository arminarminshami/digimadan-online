import Header from './Header'
import Footer from './Footer'
import BackButton from './BackButton'
import FloatingWhatsApp from './FloatingWhatsApp'
import InstallPrompt from './InstallPrompt'

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <BackButton />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <InstallPrompt />
    </>
  )
}
