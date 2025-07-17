
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Product, CartItem } from '@/lib/types';
import { ProductCard } from '@/components/pos/product-card';
import { SaleCart } from '@/components/pos/sale-cart';
import { Input } from '@/components/ui/input';
import { Search, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { isToday } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const { toast } = useToast();
  const [midnightTracker, setMidnightTracker] = useState(0);

  const { sales, products } = useData();

  const categories = useMemo(() => {
    return ['الكل', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);


  useEffect(() => {
    const getMsUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return tomorrow.getTime() - now.getTime();
    };

    const timeoutId = setTimeout(() => {
      setMidnightTracker(Date.now());
      
      const intervalId = setInterval(() => {
        setMidnightTracker(Date.now());
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(intervalId);
    }, getMsUntilMidnight());

    return () => clearTimeout(timeoutId);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, products]);

  const todaysSalesTotal = useMemo(() => {
    return sales
      .filter(sale => isToday(new Date(sale.date)))
      .reduce((total, sale) => total + sale.total, 0);
  }, [sales, midnightTracker]);


  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      const productInStock = products.find(p => p.id === product.id);
      const currentStock = productInStock ? productInStock.stock : 0;

      if (existingItem) {
        if (existingItem.quantity >= currentStock) {
          toast({
            title: "كمية غير كافية",
            description: `لا يوجد مخزون كافٍ من "${product.name}". المتبقي: ${currentStock}`,
            variant: "destructive",
          });
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (currentStock <= 0) {
           toast({
            title: "نفذ المخزون",
            description: `المنتج "${product.name}" غير متوفر حالياً.`,
            variant: "destructive",
          });
          return prevCart;
        }
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateCartItem = (
    productId: string,
    updates: Partial<Pick<CartItem, 'quantity' | 'price'>>,
    options: { validatePriceOnBlur?: boolean } = {}
  ) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.id === productId);
      if (itemIndex === -1) return prevCart;
  
      const newCart = [...prevCart];
      let itemToUpdate = { ...newCart[itemIndex] };
  
      // Handle quantity update
      if (updates.quantity !== undefined) {
        if (updates.quantity <= 0) {
          newCart.splice(itemIndex, 1);
          return newCart;
        }
        
        const productInfo = products.find(p => p.id === productId);
        if (productInfo && updates.quantity > productInfo.stock) {
          toast({
            title: "كمية غير كافية",
            description: `لا يوجد مخزون كافٍ من "${productInfo.name}". المتبقي: ${productInfo.stock}`,
            variant: "destructive",
          });
          // Do not update quantity if stock is insufficient
          return prevCart;
        }
        itemToUpdate.quantity = updates.quantity;
      }
  
      // Handle price update
      if (updates.price !== undefined) {
        const newPrice = updates.price;
        // On blur, validate the price. If it's lower than minimum, reset to minimum.
        if (options.validatePriceOnBlur && newPrice < itemToUpdate.minimumPrice) {
          toast({
            title: "سعر غير مسموح به",
            description: `تم تعديل سعر "${itemToUpdate.name}" إلى الحد الأدنى المسموح به: ${itemToUpdate.minimumPrice.toFixed(2)} د.أ`,
            variant: "destructive",
          });
          itemToUpdate.price = itemToUpdate.minimumPrice;
        } else {
          // While typing, just update the value
          itemToUpdate.price = newPrice;
        }
      }
      
      newCart[itemIndex] = itemToUpdate;
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 h-full flex flex-col">
        <div className="p-4 bg-card rounded-lg shadow-sm mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold font-headline">المنتجات</h1>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysSalesTotal.toFixed(2)} د.أ</div>
              </CardContent>
            </Card>
          </div>
          <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="ابحث باسم المنتج أو الباركود..."
                    className="pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
            {filteredProducts.map(product => {
                const productInStock = products.find(p => p.id === product.id)
                return (
                  <ProductCard key={product.id} product={productInStock || product} onAddToCart={addToCart} />
                )
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="h-full">
        <SaleCart cart={cart} onUpdateCartItem={updateCartItem} onClearCart={clearCart} products={products} />
      </div>
    </div>
  );
}
