import { CONTACT_INFO, buildWhatsAppLink } from '../lib/constants'
import './FloatingWhatsApp.css'

export default function FloatingWhatsApp() {
  return (
    <a
      href={buildWhatsAppLink(CONTACT_INFO.whatsappPhone, 'سلام، در مورد دیجی‌معدن سوال داشتم.')}
      target="_blank"
      rel="noreferrer"
      className="floating-whatsapp"
      aria-label="چت در واتساپ"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9 1-.9 2.3 0 1.3.9 2.6 1.1 2.8.2.2 1.7 2.6 4.2 3.6 2.1.8 2.5.7 3 .6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2 0-.1-.1-.2-.4-.4z" />
        <path d="M20.5 3.5A11 11 0 0 0 3.6 17.4L2 22l4.7-1.5A11 11 0 1 0 20.5 3.5zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1 1 1-3-.2-.3A9 9 0 1 1 12 21.5z" />
      </svg>
    </a>
  )
}
