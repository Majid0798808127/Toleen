export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier' | 'technician';
};

export type Product = {
  id: string;
  name: string;
  barcode: string;
  cost: number;
  price: number;
  minimumPrice: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  image: string;
  purchaseDate: string;
  supplier: string;
};

export type MaintenanceJob = {
  id: string;
  customerName: string;
  productName: string;
  issueDescription: string;
  status: 'Received' | 'In Progress' | 'Completed' | 'Awaiting Collection';
  dateReceived: string;
  cost: number;
  notes?: string;
  completionDate?: string;
};

export type CartItem = Product & {
  quantity: number;
};

export type Sale = {
  id: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string; // ISO 8601 date string
  paymentMethod: 'cash' | 'visa' | 'receivable';
};

export type Receivable = {
  id: string;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  issueDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
};
