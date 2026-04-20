const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatCurrency(amount) {
  const numericAmount = Number(amount)

  return inrCurrencyFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

export {
  formatCurrency,
}
