"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Receivable } from "@/lib/types";

const createPaymentSchema = (maxAmount: number) => z.object({
  amount: z.coerce.number()
    .positive({ message: "المبلغ يجب أن يكون أكبر من صفر." })
    .max(maxAmount, { message: `المبلغ لا يمكن أن يتجاوز المبلغ المتبقي وهو ${maxAmount.toFixed(2)} د.أ` }),
});

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
  onConfirm: (receivableId: string, amount: number) => void;
}

export function PaymentDialog({ open, onOpenChange, receivable, onConfirm }: PaymentDialogProps) {
  const remainingAmount = receivable ? receivable.totalAmount - receivable.amountPaid : 0;
  
  const form = useForm<z.infer<ReturnType<typeof createPaymentSchema>>>({
    resolver: zodResolver(createPaymentSchema(remainingAmount)),
    defaultValues: {
      amount: remainingAmount > 0 ? remainingAmount : 0,
    },
  });

  React.useEffect(() => {
    if (receivable) {
        const newRemainingAmount = receivable.totalAmount - receivable.amountPaid;
        form.reset({ amount: newRemainingAmount > 0 ? newRemainingAmount : 0 });
    }
  }, [receivable, form, open]);

  if (!receivable) return null;

  const handleFormSubmit = (data: { amount: number }) => {
    onConfirm(receivable.id, data.amount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
          <DialogDescription>
            تسجيل دفعة لـ <b>{receivable.customerName}</b>.
            <br />
            المبلغ المتبقي: {remainingAmount.toFixed(2)} د.أ
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مبلغ الدفعة (د.أ)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="أدخل مبلغ الدفعة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit">تأكيد الدفعة</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
