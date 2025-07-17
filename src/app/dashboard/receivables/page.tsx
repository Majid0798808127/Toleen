
"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Receivable } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentDialog } from '@/components/receivables/payment-dialog';
import { cn } from '@/lib/utils';
import { PageGuard } from '@/components/dashboard/page-guard';
import { DollarSign, FileDown } from 'lucide-react';
import { useData } from '@/contexts/data-context';

const statusColors: Record<Receivable['status'], string> = {
  Paid: 'bg-green-500',
  Unpaid: 'bg-destructive',
  'Partially Paid': 'bg-yellow-500',
};

const statusTranslations: Record<Receivable['status'], string> = {
  Paid: 'مدفوع',
  Unpaid: 'غير مدفوع',
  'Partially Paid': 'مدفوع جزئياً',
};

export default function ReceivablesPage() {
  const { receivables, addReceivablePayment } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unpaid');
  const [payingReceivable, setPayingReceivable] = useState<Receivable | null>(null);

  const filteredReceivables = useMemo(() => {
    return receivables
      .filter(r => {
        if (activeTab === 'all') return true;
        if (activeTab === 'paid') return r.status === 'Paid';
        if (activeTab === 'unpaid') return r.status === 'Unpaid' || r.status === 'Partially Paid';
        return true;
      })
      .filter(r => r.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [receivables, searchTerm, activeTab]);
  
  const handleConfirmPayment = (receivableId: string, amount: number) => {
    addReceivablePayment(receivableId, amount);
    setPayingReceivable(null);
  };
  
  const summary = useMemo(() => {
    const totalReceivables = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaid = receivables.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalDue = totalReceivables - totalPaid;
    return { totalReceivables, totalPaid, totalDue };
  }, [receivables]);

  return (
    <PageGuard password="0008">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">إدارة الذمم</h1>
          <Button variant="outline">
            <FileDown className="ml-2 h-4 w-4" />
            تصدير كشف
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الذمم</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReceivables.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">المبلغ الكلي لجميع الذمم المسجلة.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalPaid.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">المبلغ الإجمالي الذي تم تحصيله.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المتبقي</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.totalDue.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">المبلغ الإجمالي المستحق للدفع.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الذمم</CardTitle>
            <CardDescription>عرض وتصفية الذمم المسجلة على العملاء.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="mb-4">
                  <Input
                      placeholder="ابحث باسم العميل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">كل الذمم</TabsTrigger>
                  <TabsTrigger value="unpaid">الغير مدفوعة</TabsTrigger>
                  <TabsTrigger value="paid">المدفوعة</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                  <ReceivablesTable receivables={filteredReceivables} onPayClick={setPayingReceivable} />
              </TabsContent>
              <TabsContent value="unpaid">
                  <ReceivablesTable receivables={filteredReceivables} onPayClick={setPayingReceivable} />
              </TabsContent>
              <TabsContent value="paid">
                  <ReceivablesTable receivables={filteredReceivables} onPayClick={setPayingReceivable} />
              </TabsContent>
              </Tabs>
          </CardContent>
        </Card>

        <PaymentDialog
          open={!!payingReceivable}
          onOpenChange={(open) => !open && setPayingReceivable(null)}
          receivable={payingReceivable}
          onConfirm={handleConfirmPayment}
        />
      </div>
    </PageGuard>
  );
}

interface ReceivablesTableProps {
    receivables: Receivable[];
    onPayClick: (receivable: Receivable) => void;
}

function ReceivablesTable({ receivables, onPayClick }: ReceivablesTableProps) {
    if (receivables.length === 0) {
        return <div className="text-center text-muted-foreground p-8">لا توجد بيانات لعرضها.</div>;
    }
    
    return (
        <div className="mt-4 border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {receivables.map((r) => {
                const remaining = r.totalAmount - r.amountPaid;
                const isOverdue = new Date(r.dueDate) < new Date() && r.status !== 'Paid';
                return (
                    <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell>{r.totalAmount.toFixed(2)} د.أ</TableCell>
                    <TableCell className="text-green-600 font-medium">{r.amountPaid.toFixed(2)} د.أ</TableCell>
                    <TableCell className={cn('font-bold', remaining > 0 ? 'text-destructive' : 'text-muted-foreground')}>{remaining.toFixed(2)} د.أ</TableCell>
                    <TableCell className={cn(isOverdue && 'text-destructive font-semibold')}>
                        {format(new Date(r.dueDate), 'd MMM yyyy', { locale: enUS })}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-2 text-xs">
                        <span className={cn('h-2 w-2 rounded-full', statusColors[r.status])} />
                        {statusTranslations[r.status]}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        {r.status !== 'Paid' && (
                        <Button size="sm" onClick={() => onPayClick(r)}>
                            تسجيل دفعة
                        </Button>
                        )}
                    </TableCell>
                    </TableRow>
                )
                })}
            </TableBody>
            </Table>
        </div>
    );
}
