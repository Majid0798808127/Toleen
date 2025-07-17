"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden transition-all hover:shadow-lg",
      isOutOfStock && "opacity-60"
    )}>
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={`${product.category.toLowerCase()} product`}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-base font-semibold leading-tight mb-1">{product.name}</CardTitle>
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{product.category}</p>
            <div className={cn(
            "flex items-center text-xs",
            (isLowStock || isOutOfStock) ? "text-destructive" : "text-muted-foreground"
            )}>
                <Package className="ml-1 h-3 w-3" />
                <span>
                    {isOutOfStock ? "نفذ المخزون" : `المتبقي: ${product.stock}`}
                </span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} د.أ</p>
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-primary hover:bg-primary/10 hover:text-primary rounded-full" 
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          aria-label={`إضافة ${product.name} إلى السلة`}
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      </CardFooter>
    </Card>
  );
}
