export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  quantity: number;
  category?: string;
  timestamp: number; // Date.now()
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}
