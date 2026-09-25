export interface DefaultCategory {
  name: string;
  icon: string;
  colorHex: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
}

export const DEFAULT_INDIAN_CATEGORIES: DefaultCategory[] = [
  { name: 'Food & Dining', icon: 'restaurant', colorHex: '#FF9500', type: 'EXPENSE' },
  { name: 'Shopping', icon: 'shopping_bag', colorHex: '#AF52DE', type: 'EXPENSE' },
  { name: 'Transportation', icon: 'directions_car', colorHex: '#007AFF', type: 'EXPENSE' },
  { name: 'Bills & Utilities', icon: 'receipt', colorHex: '#FF2D55', type: 'EXPENSE' },
  { name: 'Groceries', icon: 'local_grocery_store', colorHex: '#30B0C7', type: 'EXPENSE' },
  { name: 'Entertainment', icon: 'movie', colorHex: '#FF375F', type: 'EXPENSE' },
  { name: 'Rent & Housing', icon: 'home', colorHex: '#5856D6', type: 'EXPENSE' },
  { name: 'Health & Medical', icon: 'local_hospital', colorHex: '#34C759', type: 'EXPENSE' },
  { name: 'Education', icon: 'school', colorHex: '#32ADE6', type: 'EXPENSE' },
  { name: 'Travel & Vacations', icon: 'flight', colorHex: '#00C7BE', type: 'EXPENSE' },
  { name: 'Subscriptions', icon: 'subscriptions', colorHex: '#BF5AF2', type: 'EXPENSE' },
  { name: 'Salary & Earnings', icon: 'account_balance_wallet', colorHex: '#34C759', type: 'INCOME' },
  { name: 'Investments & Dividends', icon: 'trending_up', colorHex: '#5E5CE6', type: 'INCOME' },
  { name: 'Account Transfer', icon: 'swap_horiz', colorHex: '#8E8E93', type: 'TRANSFER' },
  { name: 'Other', icon: 'more_horiz', colorHex: '#8E8E93', type: 'EXPENSE' },
];

export const KNOWN_MERCHANT_DIRECTORY: Record<string, string> = {
  // Food & Dining
  swiggy: 'Food & Dining',
  zomato: 'Food & Dining',
  starbucks: 'Food & Dining',
  mcdonalds: 'Food & Dining',
  dominos: 'Food & Dining',
  kfc: 'Food & Dining',
  chai: 'Food & Dining',
  eats: 'Food & Dining',
  freshmenu: 'Food & Dining',
  faasos: 'Food & Dining',

  // Transportation
  uber: 'Transportation',
  ola: 'Transportation',
  rapido: 'Transportation',
  metro: 'Transportation',
  irctc: 'Transportation',
  redbus: 'Transportation',
  makemytrip: 'Travel & Vacations',
  goibibo: 'Travel & Vacations',
  indigo: 'Travel & Vacations',

  // Shopping & E-commerce
  amazon: 'Shopping',
  flipkart: 'Shopping',
  myntra: 'Shopping',
  nykaa: 'Shopping',
  meesho: 'Shopping',
  ajio: 'Shopping',
  tatacliq: 'Shopping',
  croma: 'Shopping',
  ikea: 'Shopping',
  zara: 'Shopping',

  // Groceries
  blinkit: 'Groceries',
  zepto: 'Groceries',
  instamart: 'Groceries',
  bigbasket: 'Groceries',
  dmart: 'Groceries',
  naturebasket: 'Groceries',

  // Entertainment & Subscriptions
  netflix: 'Entertainment',
  spotify: 'Subscriptions',
  hotstar: 'Entertainment',
  prime: 'Subscriptions',
  youtube: 'Subscriptions',
  bookmyshow: 'Entertainment',
  apple: 'Subscriptions',

  // Bills & Utilities
  airtel: 'Bills & Utilities',
  jio: 'Bills & Utilities',
  vi: 'Bills & Utilities',
  bescom: 'Bills & Utilities',
  tneb: 'Bills & Utilities',
  mahavitaran: 'Bills & Utilities',
  tatapower: 'Bills & Utilities',
  actfiber: 'Bills & Utilities',

  // Health
  apollo: 'Health & Medical',
  pharmeasy: 'Health & Medical',
  tata1mg: 'Health & Medical',
  netmeds: 'Health & Medical',
};
