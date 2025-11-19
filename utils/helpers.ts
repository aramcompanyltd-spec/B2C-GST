export const getFieldValue = (row: any, fields: string[]): string => {
  for (const field of fields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      return String(row[field]);
    }
  }
  return '';
};

export const normalizeDate = (dateStr: string | undefined): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parts = String(dateStr).match(/(\d+)/g);
  if (!parts || parts.length < 3) return new Date().toISOString().split('T')[0];

  let day, month, year;
  
  if (parts[0].length === 4) { // YYYY-MM-DD or YYYY/MM/DD
    [year, month, day] = parts.map(p => p.padStart(2, '0'));
  } else { // DD/MM/YYYY or DD-MM-YYYY
    [day, month, year] = parts.map(p => p.padStart(2, '0'));
    if (year.length === 2) year = `20${year}`;
  }
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const calculateGST = (amount: number, gstRatio: number): number => {
  // GST rate in NZ is 15%, so the GST component is 3/23 of the GST-inclusive price.
  return Math.abs(amount) * (3 / 23) * gstRatio;
};

export const getCategoryColor = (category: string): string => {
  if (category.includes('Sales')) return 'bg-green-100 text-green-800';
  if (category.includes('Entertainment')) return 'bg-purple-100 text-purple-800';
  if (category.includes('Motor') || category.includes('Home')) return 'bg-orange-100 text-orange-800';
  if (category.includes('Purchases')) return 'bg-blue-100 text-blue-800';
  if (category.includes('Transfers')) return 'bg-gray-200 text-gray-800';
  if (category.includes('Uncategorized')) return 'bg-red-100 text-red-800';
  return 'bg-indigo-100 text-indigo-800'; // For custom categories
};