const formatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  return formatter.format(Number(amount) || 0);
}
