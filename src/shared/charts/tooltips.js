export function formatLiters(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return `${value ?? ""} L`.trim();
  return `${num} L`;
}

export function litersTooltip(value, name) {
  return [formatLiters(value), name];
}

export function percentTooltip(value, name) {
  return [`${value}%`, name];
}

export function currencyTooltip(value, name) {
  return [`Rs ${value}`, name];
}
