
"use client";

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { DateRange } from "react-day-picker";
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, Package, Receipt, Calendar as CalendarIcon, Check, ChevronsUpDown, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { PageGuard } from '@/components/dashboard/page-guard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ReportsPage() {
  const { sales, products, resetData } = useData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return ['all', ...Array.from(new Set(allCategories))];
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
  
  const paymentMethodTranslations: Record<Sale['paymentMethod'], string> = {
      cash: 'نقدي',
      visa: 'فيزا',
      receivable: 'ذمم'
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      
      let inDateRange = true;
      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        if (saleDate < fromDate) inDateRange = false;
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (saleDate > toDate) inDateRange = false;
      }
      if (!inDateRange) return false;

      if (selectedCategory === 'all') return true;

      return sale.items.some(item => {
        const productInfo = products.find(p => p.id === item.id);
        return productInfo?.category === selectedCategory;
      });
    });
  }, [sales, products, dateRange, selectedCategory]);

  const reportData = useMemo(() => {
    const calculateProfit = (sale: Sale) => {
      return sale.items.reduce((profit, item) => {
        const productInfo = products.find(p => p.id === item.id);
        const cost = productInfo ? productInfo.cost : 0;
        const itemProfit = (item.price * item.quantity) - (cost * item.quantity);
        return profit + itemProfit;
      }, 0);
    };

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalProfit = filteredSales.reduce((acc, sale) => acc + calculateProfit(sale), 0);
    const numberOfSales = filteredSales.length;

    const salesForChart = Object.entries(
      filteredSales.reduce((acc, sale) => {
        const day = format(new Date(sale.date), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + sale.total;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([date, total]) => ({ date: format(new Date(date), 'MMM d'), total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const latestSales = filteredSales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { totalRevenue, totalProfit, numberOfSales, salesForChart, latestSales };
  }, [filteredSales, products]);

  const chartConfig = {
    total: { label: "المبيعات", color: "hsl(var(--primary))" },
  };

  return (
    <PageGuard password="0008">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">تقارير المبيعات</h1>

        <Card>
          <CardHeader>
            <CardTitle>فلاتر التقرير</CardTitle>
            <CardDescription>قم بتصفية نتائج التقرير حسب النطاق الزمني أو فئة المنتج.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, yyyy", { locale: enUS })} -{' '}
                          {format(dateRange.to, "LLL dd, yyyy", { locale: enUS })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, yyyy", { locale: enUS })
                      )
                    ) : (
                      <span>النطاق الزمني: من - إلى</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={enUS}
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryPopoverOpen}
                    className="w-full md:w-[240px] justify-between"
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
                            setSelectedCategory(currentValue === cat ? cat : categories.find(c => c.toLowerCase() === currentValue) || currentValue);
                            setIsCategoryPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", selectedCategory === cat ? "opacity-100" : "opacity-0")}
                          />
                          {categoryTranslations[cat] || cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" onClick={() => { setDateRange(undefined); setSelectedCategory('all'); }}>
                  إلغاء الفلاتر
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="ml-2 h-4 w-4" />
                  إعادة تعيين البيانات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف جميع بيانات المبيعات والذمم والتقارير بشكل دائم، وإعادة تعيين المخزون إلى حالته الأولية.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={resetData} className={cn(buttonVariants({variant: 'destructive'}))}>
                    نعم، قم بإعادة التعيين
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalRevenue.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">الإيرادات للفترة المحددة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalProfit.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">الربح للفترة المحددة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد المبيعات</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.numberOfSales}</div>
              <p className="text-xs text-muted-foreground">إجمالي عمليات البيع في الفترة المحددة</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>نظرة عامة على المبيعات</CardTitle>
              <CardDescription>المبيعات اليومية للفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={reportData.salesForChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} د.أ`} />
                  <Tooltip
                      content={<ChartTooltipContent
                      formatter={(value) => `${Number(value).toFixed(2)} د.أ`}
                      indicator="dot" />}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>أحدث المبيعات</CardTitle>
              <CardDescription>
                أحدث المبيعات ضمن الفترة المحددة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الدفع</TableHead>
                      <TableHead className="text-left">الإجمالي</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {reportData.latestSales.map((sale) => (
                      <TableRow key={sale.id}>
                          <TableCell>
                              <div className="font-medium">{sale.customerName}</div>
                              <div className="hidden text-sm text-muted-foreground md:inline">
                                  {sale.id}
                              </div>
                          </TableCell>
                          <TableCell>{format(new Date(sale.date), 'LLL d, yyyy, h:mm a', { locale: enUS })}</TableCell>
                          <TableCell>{paymentMethodTranslations[sale.paymentMethod]}</TableCell>
                          <TableCell className="text-left">{sale.total.toFixed(2)} د.أ</TableCell>
                      </TableRow>
                      ))}
                      {reportData.latestSales.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                لا توجد مبيعات في الفترة المحددة.
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageGuard>
  );
}
