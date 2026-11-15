// لرزش خفیف هنگام لمس آیکون‌ها
// - اندروید: Vibration API
// - آیفون: Safari لرزش وب را پشتیبانی نمی‌کند؛ از ترفند «سوییچ» iOS (نسخه‌های جدید) استفاده می‌شود و اگر پشتیبانی نشود بی‌صدا نادیده گرفته می‌شود.
let last = 0
let iosLabel = null

function iosTick() {
  try {
    if (!iosLabel) {
      iosLabel = document.createElement('label')
      iosLabel.setAttribute('aria-hidden', 'true')
      iosLabel.setAttribute('data-haptic-source', '1')
      iosLabel.style.cssText = 'position:fixed;left:-200px;top:-200px;width:1px;height:1px;opacity:0;pointer-events:none;'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('switch', '')
      input.tabIndex = -1
      iosLabel.appendChild(input)
      document.body.appendChild(iosLabel)
    }
    iosLabel.click()
  } catch {
    /* ignore */
  }
}

export function haptic(ms = 10) {
  const now = Date.now()
  if (now - last < 40) return
  last = now
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
      return
    }
  } catch {
    /* ignore */
  }
  iosTick()
}

// همه‌ی دکمه‌ها، لینک‌ها و آیکون‌های قابل لمس در اپلیکیشن
export function installGlobalHaptics() {
  function onClick(e) {
    const t = e.target
    if (!t || !t.closest) return
    if (t.closest('[data-haptic-source]')) return
    // منوی انتخاب، فیلدها و برچسب‌های فرم را خراب نکن (در آیفون باز شدن لیست انتخاب را مختل می‌کرد)
    if (t.closest('select, input, textarea, label, option, [contenteditable="true"]')) return
    const el = t.closest('a[href], button, [role="button"], summary')
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return
    haptic()
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
