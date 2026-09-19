export function hourGreet() {
  const h = new Date().getHours()
  if (h < 11) return 'Good Morning!'
  if (h < 17) return 'Good Afternoon!'
  return 'Good Evening!'
}
