export function toLocalISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDaysISO(daysAhead: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return toLocalISO(date)
}
