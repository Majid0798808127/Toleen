"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Sale, Receivable, CartItem, Product, MaintenanceJob } from '@/lib/types';
import { 
  sales as initialSales, 
  receivables as initialReceivables, 
  products as initialProducts,
  maintenanceJobs as initialMaintenanceJobs
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Helper to get data from localStorage
const getFromStorage = <T,>(key: string, initialValue: T): T => {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return initialValue;
  }
};

// Helper to set data to localStorage
const setInStorage = <T,>(key:string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
}

interface DataContextType {
  products: Product[];
  sales: Sale[];
  receivables: Receivable[];
  maintenanceJobs: MaintenanceJob[];
  addProduct: (productData: ProductFormValues) => void;
  updateProduct: (productId: string, productData: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  addSale: (cart: CartItem[], total: number, paymentMethod: Sale['paymentMethod'], customerName?: string) => void;
  addReceivable: (customerName: string, totalAmount: number, dueDate: Date) => void;
  addReceivablePayment: (receivableId: string, amount: number) => void;
  addMaintenanceJob: (jobData: Omit<MaintenanceJob, 'id' | 'dateReceived' | 'status' | 'cost' | 'completionDate'>) => void;
  updateMaintenanceJob: (jobId: string, updates: Partial<MaintenanceJob>) => void;
  resetData: () => void;
  loading: boolean;
}

// We need this type for the addProduct function argument
import { type ProductFormValues } from '@/components/inventory/add-product-dialog';

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJob[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    setProducts(getFromStorage('app_products', initialProducts));
    setSales(getFromStorage('app_sales', initialSales));
    setReceivables(getFromStorage('app_receivables', initialReceivables));
    setMaintenanceJobs(getFromStorage('app_maintenance_jobs', initialMaintenanceJobs));
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (!loading) setInStorage('app_products', products);
  }, [products, loading]);
  
  useEffect(() => {
    if (!loading) setInStorage('app_sales', sales);
  }, [sales, loading]);

  useEffect(() => {
    if (!loading) setInStorage('app_receivables', receivables);
  }, [receivables, loading]);

  useEffect(() => {
    if (!loading) setInStorage('app_maintenance_jobs', maintenanceJobs);
  }, [maintenanceJobs, loading]);

  const addProduct = (data: ProductFormValues) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      ...data,
      image: data.image || 'https://placehold.co/300x300.png',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    };
    setProducts(prev => [newProduct, ...prev]);
  };
  
  const updateProduct = (productId: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
  };
  
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const addSale = (
    cart: CartItem[],
    total: number,
    paymentMethod: Sale['paymentMethod'],
    customerName: string = 'زبون نقدي',
  ) => {
    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      customerName,
      items: cart,
      subtotal: total,
      tax: 0,
      total,
      date: new Date().toISOString(),
      paymentMethod,
    };
    setSales(prev => [newSale, ...prev]);

    // Deduct stock
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      cart.forEach(cartItem => {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock - cartItem.quantity
          };
        }
      });
      return updatedProducts;
    });

    if (paymentMethod !== 'receivable') {
      toast({
        title: "اكتمل البيع!",
        description: `الإجمالي: ${total.toFixed(2)} د.أ (${paymentMethod === 'cash' ? 'نقدي' : 'فيزا'}).`,
      });
    }
  };

  const addReceivable = (customerName: string, totalAmount: number, dueDate: Date) => {
    const newReceivable: Receivable = {
        id: `R-${Date.now()}`,
        customerName: customerName,
        totalAmount: totalAmount,
        amountPaid: 0,
        issueDate: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'Unpaid',
    };
    setReceivables(prev => [newReceivable, ...prev]);

    toast({
        title: "تم تسجيل الدين بنجاح",
        description: `دين على ${customerName} بقيمة ${totalAmount.toFixed(2)} د.أ يستحق في ${format(dueDate, "PPP")}.`,
    });
  };

  const addReceivablePayment = (receivableId: string, amount: number) => {
    setReceivables(prev => {
      return prev.map(r => {
        if (r.id === receivableId) {
          const newAmountPaid = r.amountPaid + amount;
          let newStatus: Receivable['status'] = 'Partially Paid';
          if (newAmountPaid >= r.totalAmount) {
            newStatus = 'Paid';
          }
          return { ...r, amountPaid: newAmountPaid, status: newStatus };
        }
        return r;
      });
    });

    toast({
      title: 'تم تسجيل الدفعة',
      description: `تم تسجيل دفعة بقيمة ${amount.toFixed(2)} د.أ بنجاح.`,
    });
  };

  const addMaintenanceJob = (jobData: Omit<MaintenanceJob, 'id' | 'dateReceived' | 'status' | 'cost' | 'completionDate'>) => {
    const newJob: MaintenanceJob = {
      id: `M-${Date.now()}`,
      ...jobData,
      dateReceived: format(new Date(), 'yyyy-MM-dd'),
      status: 'Received',
      cost: 0
    };
    setMaintenanceJobs(prev => [newJob, ...prev]);
    toast({ title: 'تم إضافة طلب الصيانة بنجاح' });
  };

  const updateMaintenanceJob = (jobId: string, updates: Partial<MaintenanceJob>) => {
    setMaintenanceJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const updatedJob = { ...job, ...updates };
        if ((updates.status === 'Completed' || updates.status === 'Awaiting Collection') && !job.completionDate) {
          updatedJob.completionDate = format(new Date(), 'yyyy-MM-dd');
        }
        return updatedJob;
      }
      return job;
    }));
  };
  
  const resetData = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('app_products');
      window.localStorage.removeItem('app_sales');
      window.localStorage.removeItem('app_receivables');
      window.localStorage.removeItem('app_maintenance_jobs');
    }
    setProducts(initialProducts);
    setSales(initialSales);
    setReceivables(initialReceivables);
    setMaintenanceJobs(initialMaintenanceJobs);
    toast({
      title: "تم إعادة تعيين البيانات",
      description: "تمت استعادة جميع بيانات التطبيق إلى حالتها الافتراضية.",
    });
  };

  return (
    <DataContext.Provider value={{ products, sales, receivables, maintenanceJobs, addProduct, updateProduct, deleteProduct, addSale, addReceivable, addReceivablePayment, addMaintenanceJob, updateMaintenanceJob, resetData, loading }}>
      {!loading ? children : (
         <div className="flex h-screen items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
         </div>
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
