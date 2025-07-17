"use client";

import React, { useState } from 'react';
import type { CartItem, Product, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, MinusCircle, PlusCircle, ShoppingCart, Banknote, CreditCard, BookUser } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReceivablesDialog, type ReceivablesFormValues } from './receivables-dialog';
import { useData } from '@/contexts/data-context';

interface SaleCartProps {
  cart: CartItem[];
  onUpdateCartItem: (productId: string, updates: Partial<Pick<CartItem, 'quantity' | 'price'>>, options?: { validatePriceOnBlur?: boolean }) => void;
  onClearCart: () => void;
  products: Product[];
}

export function SaleCart({ cart, onUpdateCartItem, onClearCart, products }: SaleCartProps) {
  const { addSale, addReceivable } = useData();
  const [isReceivablesDialogOpen, setIsReceivablesDialogOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<'cash' | 'visa' | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Tax removed

  const handlePayment = (method: 'cash' | 'visa') => {
    addSale(cart, total, method, 'زبون نقدي');
    onClearCart();
    setConfirmingPayment(null);
  };
  
  const handleReceivablesConfirm = (data: ReceivablesFormValues) => {
    addSale(cart, total, 'receivable', data.debtorName);
    addReceivable(data.debtorName, total, data.dueDate);
    onClearCart();
  };

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className='pb-4'>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          البيع الحالي
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <ShoppingCart className="h-20 w-20 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">عربة التسوق فارغة.</p>
                    <p className="text-sm text-muted-foreground/80">أضف منتجات للبدء.</p>
                </div>
            ) : (
                <div className="divide-y">
                {cart.map(item => {
                    const productInStock = products.find(p => p.id === item.id);
                    const stock = productInStock ? productInStock.stock : 0;
                    return (
                    <div key={item.id} className="flex items-start p-4 gap-2">
                        <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <div className="relative w-28 mt-1">
                                <Input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => onUpdateCartItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                    onBlur={() => onUpdateCartItem(item.id, { price: item.price }, { validatePriceOnBlur: true })}
                                    className="h-8 pl-6 pr-2 text-sm"
                                    step="0.01"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">د.أ</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onUpdateCartItem(item.id, { quantity: item.quantity - 1 })}>
                                <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-bold">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onUpdateCartItem(item.id, { quantity: item.quantity + 1 })} disabled={item.quantity >= stock}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="w-24 text-left font-semibold mt-1">{(item.price * item.quantity).toFixed(2)} د.أ</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive/70 hover:text-destructive mt-1" onClick={() => onUpdateCartItem(item.id, { quantity: 0 })}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    )
                })}
                </div>
            )}
        </ScrollArea>
      </CardContent>
      {cart.length > 0 && (
        <>
            <Separator />
            <CardFooter className="p-4 flex flex-col gap-4">
            <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toFixed(2)} د.أ</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                <span>المجموع الكلي</span>
                <span>{total.toFixed(2)} د.أ</span>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full">
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setConfirmingPayment('cash')}>
                  <Banknote className="ml-2 h-4 w-4" />
                  نقدي
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setConfirmingPayment('visa')}>
                  <CreditCard className="ml-2 h-4 w-4" />
                  فيزا
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => setIsReceivablesDialogOpen(true)}>
                  <BookUser className="ml-2 h-4 w-4" />
                  ذمم
              </Button>
            </div>

            </CardFooter>
            
            <AlertDialog open={!!confirmingPayment} onOpenChange={(open) => !open && setConfirmingPayment(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد البيع</AlertDialogTitle>
                  <AlertDialogDescription>
                      سيؤدي هذا إلى إنهاء المعاملة بإجمالي {total.toFixed(2)} د.أ. هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmingPayment(null)}>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handlePayment(confirmingPayment!)} className="bg-primary hover:bg-primary/90">
                      تأكيد الدفع
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <ReceivablesDialog
              open={isReceivablesDialogOpen}
              onOpenChange={setIsReceivablesDialogOpen}
              total={total}
              onConfirm={handleReceivablesConfirm}
            />
        </>
      )}
    </Card>
  );
}
