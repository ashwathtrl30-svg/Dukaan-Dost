export type Language = 'en' | 'hi';
export type Theme = 'light' | 'dark';

export type ShopType = 
  | 'kirana' | 'medical' | 'bakery' | 'sweet' | 'tailor' 
  | 'salon' | 'hardware' | 'mobile' | 'vegetable' | 'tea' 
  | 'restaurant' | 'other';

export type Duration = 'under1' | '1to5' | '5to10' | 'over10';
export type Ownership = 'own' | 'rent';
export type MonthlySales = 'under50k' | '50kto1L' | '1Lto3L' | '3Lto5L' | '5Lto10L' | 'over10L';
export type UdhaarLevel = 'never' | 'sometimes' | 'often';
export type AccountingMethod = 'memory' | 'notebook' | 'app' | 'nothing';
export type Worry = 'low_profit' | 'too_much_stock' | 'customers_not_paying' | 'rising_costs' | 'competition' | 'no_time' | 'dont_know';

export type PaymentType = 'cash' | 'upi' | 'udhaar';

export interface ShopProfile {
  shopType: ShopType | null;
  shopName: string;
  city: string;
  duration: Duration | null;
  ownership: Ownership | null;
  workers: number;
  monthlySales: MonthlySales | null;
  udhaarLevel: UdhaarLevel | null;
  accounting: AccountingMethod | null;
  worries: Worry[];
}

export interface SaleEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  itemName?: string;
  category?: string;
  paymentType: PaymentType;
  note?: string;
  createdAt: number;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  note?: string;
  createdAt: number;
}

export interface UdhaarEntry {
  id: string;
  customerName: string;
  amount: number;
  date: string;
  dueDate?: string;
  paid: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  language?: 'en' | 'hi';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface Insight {
  id: string;
  type: 'profit' | 'cost' | 'udhaar' | 'stock' | 'season' | 'pricing' | 'cash' | 'win';
  headline: string;
  explanation: string;
  action: string;
  dataSource: string;
  useful?: boolean;
  createdAt: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  completed: boolean;
}

export interface AppState {
  language: Language | null;
  theme: Theme;
  onboardingStep: number;
  onboardingComplete: boolean;
  shopProfile: ShopProfile;
  sales: SaleEntry[];
  expenses: ExpenseEntry[];
  udhaar: UdhaarEntry[];
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  insights: Insight[];
  phoneNumber: string;
  userName: string;
  reminderTime: string;
  streak: number;
  lastEntryDate: string;
  textSize: 'normal' | 'large';
  lockEnabled: boolean;
  lockPin: string;
  notificationsEnabled: boolean;
  alertTypes: Record<string, boolean>;
}
