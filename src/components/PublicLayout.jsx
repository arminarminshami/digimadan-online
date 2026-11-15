import Header from './Header'
import Footer from './Footer'
import BackButton from './BackButton'
import FloatingWhatsApp from './FloatingWhatsApp'
import InstallPrompt from './InstallPrompt'
import AppLayout from '../app/AppLayout'
import { APP_MODE } from '../app/appMode'

export default function PublicLayout({ children }) {
  // وب‌اپ نصب‌شده روی گوشی: ظاهر اپلیکیشن (نوار پایین، صفحه‌ی آیکونی و ...)
  if (APP_MODE) return <AppLayout>{children}</AppLayout>

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
