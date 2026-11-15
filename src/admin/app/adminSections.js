// بخش‌های پنل مدیریت (آیکون‌ها در صفحه‌ی خانه‌ی اپلیکیشن مدیریت)
export const ADMIN_GROUPS = [
  {
    title: 'محتوا و بازار',
    items: [
      { to: '/admin/ads', label: 'آگهی‌ها', icon: 'list', color: '#C2703D', badgeKey: 'pending' },
      { to: '/admin/auctions', label: 'مزایده‌ها', icon: 'gavel', color: '#B5483A' },
      { to: '/admin/content', label: 'مقالات و اخبار', icon: 'article', color: '#7A6A58' },
      { to: '/admin/banners', label: 'بنرها', icon: 'image', color: '#3E7CB1' },
      { to: '/admin/pages', label: 'صفحات سایت', icon: 'file', color: '#5C7A52' },
      { to: '/admin/lab-equipment', label: 'تجهیزات آزمایشگاهی', icon: 'flask', color: '#8E5BB5' },
      { to: '/admin/prices', label: 'قیمت‌ها', icon: 'chart', color: '#2E8B7A' },
    ],
  },
  {
    title: 'کاربران و مالی',
    items: [
      { to: '/admin/users', label: 'کاربران', icon: 'users', color: '#3A6EA5' },
      { to: '/admin/wallets', label: 'کیف‌پول و امتیاز', icon: 'wallet', color: '#D9A21B' },
    ],
  },
  {
    title: 'ارتباطات',
    items: [
      { to: '/admin/send-sms', label: 'ارسال پیام', icon: 'send', color: '#D9822B' },
      { to: '/admin/sms-patterns', label: 'الگوهای پیامک', icon: 'file', color: '#7A6A58' },
      { to: '/admin/sms', label: 'گزارش پیامک', icon: 'sms', color: '#3E7CB1' },
      { to: '/admin/instagram', label: 'اینستاگرام', icon: 'send', color: '#B83280' },
    ],
  },
  {
    title: 'سیستم',
    items: [
      { to: '/admin/stats', label: 'آمار سایت', icon: 'chart', color: '#2E8B7A' },
      { to: '/admin/settings', label: 'تنظیمات', icon: 'gear', color: '#6B675D' },
    ],
  },
]

const TITLES = {
  '/admin': 'پنل مدیریت',
  '/admin/stats': 'آمار سایت',
  '/admin/ads': 'آگهی‌ها',
  '/admin/ads/new': 'آگهی جدید',
  '/admin/auctions': 'مزایده‌ها',
  '/admin/auctions/new': 'مزایده جدید',
  '/admin/users': 'کاربران',
  '/admin/users/new': 'کاربر جدید',
  '/admin/content': 'مقالات و اخبار',
  '/admin/banners': 'بنرها',
  '/admin/pages': 'صفحات سایت',
  '/admin/pages/new': 'صفحه‌ی جدید',
  '/admin/lab-equipment': 'تجهیزات آزمایشگاهی',
  '/admin/prices': 'قیمت‌ها',
  '/admin/wallets': 'کیف‌پول و امتیاز',
  '/admin/send-sms': 'ارسال پیام',
  '/admin/sms-patterns': 'الگوهای پیامک',
  '/admin/sms': 'گزارش پیامک',
  '/admin/instagram': 'اینستاگرام',
  '/admin/settings': 'تنظیمات',
}

export function adminTitleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  if (/^\/admin\/ads\/[^/]+\/edit$/.test(pathname)) return 'ویرایش آگهی'
  if (/^\/admin\/auctions\/[^/]+\/edit$/.test(pathname)) return 'ویرایش مزایده'
  if (/^\/admin\/auctions\/[^/]+\/participants$/.test(pathname)) return 'شرکت‌کنندگان مزایده'
  if (/^\/admin\/users\/[^/]+\/edit$/.test(pathname)) return 'ویرایش کاربر'
  if (/^\/admin\/pages\/[^/]+\/edit$/.test(pathname)) return 'ویرایش صفحه'
  return 'پنل مدیریت'
}

// صفحه‌های اصلی نوار پایین دکمه‌ی بازگشت ندارند
export const ADMIN_ROOTS = ['/admin', '/admin/ads', '/admin/auctions', '/admin/users']
