// Money helpers. All math is done in integer cents so totals always add up.

// "12.345" -> 1235, "" or invalid -> 0
export function toCents(value) {
  const n = parseFloat(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

// 1235 -> "12.35"
export function formatCents(cents) {
  return (cents / 100).toFixed(2)
}

// Split totalCents equally among ids.
// Leftover cents (e.g. $10.00 / 3 = 1¢ extra) go to `remainderTo`
// (or to the first id if remainderTo is not among them).
// Returns { amounts: { [id]: cents }, base, remainder }
export function splitEqually(totalCents, ids, remainderTo) {
  const amounts = {}
  if (ids.length === 0 || totalCents <= 0) {
    ids.forEach(id => { amounts[id] = 0 })
    return { amounts, base: 0, remainder: 0 }
  }
  const base = Math.floor(totalCents / ids.length)
  const remainder = totalCents - base * ids.length
  const receiver = ids.includes(remainderTo) ? remainderTo : ids[0]
  ids.forEach(id => { amounts[id] = base })
  amounts[receiver] += remainder
  return { amounts, base, remainder }
}

// For custom splits: how much of the total is still unassigned.
// Positive = left to assign, negative = over the total, 0 = balanced.
export function unassignedCents(totalCents, manualAmounts, ids) {
  const assigned = ids.reduce((sum, id) => sum + toCents(manualAmounts[id]), 0)
  return totalCents - assigned
}