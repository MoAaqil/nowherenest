export const convertPrice = (priceInINR) => {
  const currency = localStorage.getItem('currency') || 'INR';
  if (currency === 'USD') return priceInINR / 83;
  if (currency === 'EUR') return priceInINR / 90;
  return priceInINR;
};

export const formatPrice = (priceInINR) => {
  const currency = localStorage.getItem('currency') || 'INR';
  const converted = convertPrice(priceInINR);
  if (currency === 'USD') {
    return `$${converted.toFixed(2)}`;
  }
  if (currency === 'EUR') {
    return `€${converted.toFixed(2)}`;
  }
  return `₹${Math.round(converted).toLocaleString('en-IN')}`;
};

export const getCurrencySymbol = () => {
  const currency = localStorage.getItem('currency') || 'INR';
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  return '₹';
};
