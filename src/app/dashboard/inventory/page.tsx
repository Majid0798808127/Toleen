
"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Product } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, FileDown, MoreHorizontal, Calendar as CalendarIcon, Check, ChevronsUpDown, DollarSign, Package, Landmark, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { AddProductDialog, ProductFormValues } from '@/components/inventory/add-product-dialog';
import { useToast } from "@/hooks/use-toast";
import { PageGuard } from '@/components/dashboard/page-guard';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle as DialogTitleComponent } from '@/components/ui/dialog';
import { useData } from '@/contexts/data-context';


export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isSummaryGuardOpen, setIsSummaryGuardOpen] = useState(false);
  const [summaryPasswordInput, setSummaryPasswordInput] = useState('');


  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [products]);

  const inventorySummary = useMemo(() => {
    const totalSaleValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
    const totalMinValue = products.reduce((sum, p) => sum + (p.minimumPrice * p.stock), 0);
    return { totalSaleValue, totalCostValue, totalMinValue };
  }, [products]);

  const categoryTranslations: { [key: string]: string } = {
    'all': 'كل الفئات',
    'Cameras': 'كاميرات',
    'Computers': 'كمبيوترات',
    'Laptops': 'لابتوبات',
    'Phones': 'هواتف',
    'Accessories': 'إكسسوارات',
    'Audio': 'صوتيات',
    'Repair Parts': 'قطع غيار',
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSupplier = !supplier || p.supplier.toLowerCase().includes(supplier.toLowerCase());
      const matchesDate = !purchaseDate || p.purchaseDate === format(purchaseDate, "yyyy-MM-dd");
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesSupplier && matchesDate && matchesCategory;
    });
  }, [products, searchTerm, supplier, purchaseDate, selectedCategory]);

  const lowStockProducts = useMemo(() => {
    return filteredProducts.filter(p => p.stock <= p.lowStockThreshold);
  }, [filteredProducts]);
  
  const handleOpenAddDialog = () => {
    setProductToEdit(null);
    setIsProductDialogOpen(true);
  };

  const handleOpenEditDialog = (product: Product) => {
    setProductToEdit(product);
    setIsProductDialogOpen(true);
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
  };
  
  const handleDialogClose = () => {
    setIsProductDialogOpen(false);
    setProductToEdit(null);
  };

  const handleSubmit = (data: ProductFormValues, productId?: string) => {
    if (productId) {
      updateProduct(productId, { ...data, image: data.image || 'https://placehold.co/300x300.png' });
      toast({
        title: "تم تعديل المنتج بنجاح",
        description: `تم تحديث بيانات "${data.name}".`,
      });
    } else {
      addProduct(data);
      toast({
        title: "تم إضافة المنتج بنجاح",
        description: `تمت إضافة "${data.name}" إلى المخزون.`,
      });
    }
    handleDialogClose();
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    toast({
      title: "تم حذف المنتج بنجاح",
      description: `تم حذف "${productToDelete.name}" من المخزون.`,
      variant: 'destructive',
    });
    setProductToDelete(null);
  };

  const handleSummaryVerify = () => {
    if (summaryPasswordInput === '0008') {
      setIsSummaryVisible(true);
      setIsSummaryGuardOpen(false);
      setSummaryPasswordInput('');
      toast({ title: 'تم التحقق بنجاح', description: 'تم عرض ملخص المخزون.' });
    } else {
      toast({ title: 'فشل التحقق', description: 'كلمة المرور غير صحيحة.', variant: 'destructive' });
      setSummaryPasswordInput('');
    }
  };
  
  const renderProductRows = (productsToRender: Product[]) => {
      return productsToRender.map((product) => (
        <TableRow key={product.id}>
          <TableCell>
            <Image
              src={product.image}
              alt={product.name}
              width={40}
              height={40}
              className="rounded-md object-cover"
              data-ai-hint={`${product.category.toLowerCase()} product`}
            />
          </TableCell>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell>
            <Badge variant="outline">{product.category}</Badge>
          </TableCell>
          <TableCell>{product.supplier}</TableCell>
          <TableCell>{product.purchaseDate}</TableCell>
          <TableCell>
            <div className={`font-mono font-code ${product.stock <= product.lowStockThreshold ? 'text-destructive' : ''}`}>
              {product.stock}
            </div>
          </TableCell>
          <TableCell>{product.price.toFixed(2)} د.أ</TableCell>
          <TableCell>{product.cost.toFixed(2)} د.أ</TableCell>
          <TableCell className="font-mono font-code">{product.barcode}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenEditDialog(product)}>تعديل</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleOpenDeleteDialog(product)}
                >
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
  }

  const tableHeaders = (
    <TableRow>
      <TableHead>صورة</TableHead>
      <TableHead>الاسم</TableHead>
      <TableHead>الفئة</TableHead>
      <TableHead>المورد</TableHead>
      <TableHead>تاريخ الشراء</TableHead>
      <TableHead>المخزون</TableHead>
      <TableHead>سعر البيع</TableHead>
      <TableHead>التكلفة</TableHead>
      <TableHead>الباركود</TableHead>
      <TableHead>إجراءات</TableHead>
    </TableRow>
  );

  return (
    <PageGuard password="0008">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">المخزون</h1>
          <div className="flex gap-2">
              <Button variant="outline">
                  <FileDown className="ml-2 h-4 w-4" />
                  تصدير
              </Button>
              <Button onClick={handleOpenAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="ml-2 h-4 w-4" />
                  إضافة منتج
              </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ملخص المخزون</CardTitle>
              {isSummaryVisible ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSummaryVisible(false)}>
                      <EyeOff className="h-4 w-4" />
                      <span className="sr-only">إخفاء الملخص</span>
                  </Button>
              ) : (
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsSummaryGuardOpen(true)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">عرض الملخص</span>
                  </Button>
              )}
          </CardHeader>
          {isSummaryVisible && (
              <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">قيمة المخزون (سعر البيع)</CardTitle>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{inventorySummary.totalSaleValue.toFixed(2)} د.أ</div>
                              <p className="text-xs text-muted-foreground">القيمة الإجمالية للمخزون بسعر البيع</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">قيمة المخزون (التكلفة)</CardTitle>
                              <Package className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{inventorySummary.totalCostValue.toFixed(2)} د.أ</div>
                              <p className="text-xs text-muted-foreground">القيمة الإجمالية للمخزون بسعر التكلفة</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">قيمة المخزون (الحد الأدنى)</CardTitle>
                              <Landmark className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">{inventorySummary.totalMinValue.toFixed(2)} د.أ</div>
                              <p className="text-xs text-muted-foreground">القيمة الإجمالية بأقل سعر بيع ممكن</p>
                          </CardContent>
                      </Card>
                  </div>
              </CardContent>
          )}
          {!isSummaryVisible && (
            <CardContent>
              <div className="flex items-center justify-center h-24 bg-muted/50 rounded-md">
                <p className="text-muted-foreground">المحتوى محمي. انقر على أيقونة العين لعرضه.</p>
              </div>
            </CardContent>
          )}
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="ابحث عن منتج بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-1"
          />
          <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isCategoryPopoverOpen}
                className="w-full justify-between"
              >
                {selectedCategory === 'all'
                  ? categoryTranslations['all']
                  : categoryTranslations[selectedCategory] || selectedCategory}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="ابحث عن فئة..." />
                <CommandEmpty>لم يتم العثور على فئة.</CommandEmpty>
                <CommandGroup>
                  {categories.map((cat) => (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={(currentValue) => {
                        setSelectedCategory(currentValue === 'all' ? currentValue : categories.find(c => c.toLowerCase() === currentValue) || currentValue);
                        setIsCategoryPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory === cat ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {categoryTranslations[cat] || cat}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="ابحث باسم المورد..."
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !purchaseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, "PPP") : <span>اختر تاريخ الشراء</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={setPurchaseDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
              <TabsTrigger value="all">كل المنتجات</TabsTrigger>
              <TabsTrigger value="low-stock">
                  مخزون منخفض
                  {lowStockProducts.length > 0 && <Badge className="mr-2 bg-destructive">{lowStockProducts.length}</Badge>}
              </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
              <Card className="mt-4">
                  <Table>
                  <TableHeader>
                    {tableHeaders}
                  </TableHeader>
                  <TableBody>
                      {renderProductRows(filteredProducts)}
                  </TableBody>
                  </Table>
              </Card>
          </TabsContent>
          <TabsContent value="low-stock">
              <Card className="mt-4">
                  <Table>
                  <TableHeader>
                    {tableHeaders}
                  </TableHeader>
                  <TableBody>
                      {renderProductRows(lowStockProducts)}
                  </TableBody>
                  </Table>
              </Card>
          </TabsContent>
        </Tabs>
        <AddProductDialog
          open={isProductDialogOpen}
          onOpenChange={(open) => !open && handleDialogClose()}
          onSubmit={handleSubmit}
          products={products}
          productToEdit={productToEdit}
        />
        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف المنتج "{productToDelete?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog open={isSummaryGuardOpen} onOpenChange={setIsSummaryGuardOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitleComponent>الوصول مطلوب</DialogTitleComponent>
                    <DialogDescription>
                        هذا القسم محمي بكلمة مرور. يرجى إدخال كلمة المرور للمتابعة.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        id="summary-password"
                        type="password"
                        value={summaryPasswordInput}
                        onChange={(e) => setSummaryPasswordInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSummaryVerify() }}
                        placeholder="أدخل كلمة المرور"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSummaryVerify}>دخول</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
