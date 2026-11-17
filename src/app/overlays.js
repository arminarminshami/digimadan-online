// وضعیت پنجره‌های روی صفحه تا دو پنجره هم‌زمان روی هم باز نشوند
let updateOpen = false
export const setUpdateOpen = (v) => {
  updateOpen = Boolean(v)
}
export const isUpdateOpen = () => updateOpen
