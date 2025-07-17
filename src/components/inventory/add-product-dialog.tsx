
"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import type { Product } from "@/lib/types";
import { RefreshCw, Printer, Check, ChevronsUpDown, ImageIcon, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintableBarcode } from "./printable-barcode";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { flushSync } from "react-dom";

const createProductSchema = (existingProducts: Product[], editingProductId?: string) => z.object({
  barcode: z.string().min(1, { message: "الباركود مطلوب." })
    .refine(
      (barcode) => {
        const conflictingProduct = existingProducts.find((p) => p.barcode === barcode);
        return !conflictingProduct || conflictingProduct.id === editingProductId;
      },
      {
        message: "هذا الباركود موجود بالفعل.",
      }
    ),
  name: z.string().min(1, { message: "اسم المنتج مطلوب." }),
  image: z.string().optional().or(z.literal('')),
  cost: z.coerce.number().min(0, { message: "التكلفة يجب أن تكون رقمًا موجبًا." }),
  price: z.coerce.number().min(0, { message: "سعر البيع يجب أن يكون رقمًا موجبًا." }),
  minimumPrice: z.coerce.number().min(0, { message: "الحد الأدنى للسعر يجب أن يكون رقمًا موجبًا." }),
  stock: z.coerce.number().int().min(0, { message: "المخزون يجب أن يكون عددًا صحيحًا موجبًا." }),
  lowStockThreshold: z.coerce.number().int().min(0, { message: "حد المخزون المنخفض يجب أن يكون عددًا صحيحًا." }),
  category: z.string().optional().or(z.literal('')),
  supplier: z.string().optional().or(z.literal('')),
}).refine(data => data.price >= data.minimumPrice, {
  message: "سعر البيع يجب أن يكون أعلى أو مساوياً للحد الأدنى للسعر.",
  path: ["price"],
});

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormValues, productId?: string) => void;
  products: Product[];
  productToEdit?: Product | null;
}

export function AddProductDialog({ open, onOpenChange, onSubmit, products, productToEdit }: ProductDialogProps) {
  const isEditMode = !!productToEdit;
  const productSchema = useMemo(() => createProductSchema(products, productToEdit?.id), [products, productToEdit]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
        name: "",
        barcode: "",
        cost: 0,
        price: 0,
        minimumPrice: 0,
        stock: 0,
        lowStockThreshold: 5,
        supplier: "",
        category: "",
        image: ""
    }
  });
  
  useEffect(() => {
    if (open) {
      if (isEditMode && productToEdit) {
        form.reset(productToEdit);
        setImagePreview(productToEdit.image);
      } else {
        form.reset({
          name: "",
          barcode: "",
          cost: 0,
          price: 0,
          minimumPrice: 0,
          stock: 0,
          lowStockThreshold: 5,
          supplier: "",
          category: "",
          image: ""
        });
        setImagePreview(null);
      }
    }
  }, [open, isEditMode, productToEdit, form]);

  const barcodeValue = form.watch('barcode');
  const productNameValue = form.watch('name');

  const printableComponentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
  });

  const handleFormSubmit = (data: ProductFormValues) => {
    onSubmit(data, productToEdit?.id);
  };

  const generateBarcodeAndPrint = () => {
    const newBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    // Force a synchronous re-render to update the barcode value in the DOM
    flushSync(() => {
      form.setValue('barcode', newBarcode, { shouldValidate: true });
    });
    // Now that the DOM is updated, trigger the print dialog. This maintains
    // the user-initiated event context, avoiding pop-up blockers.
    handlePrint();
  };
  
  const handleManualPrint = () => {
    if(barcodeValue) {
      handlePrint();
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue("image", dataUri, { shouldValidate: true });
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const dialogTitle = isEditMode ? "تعديل المنتج" : "إضافة منتج جديد";
  const dialogDescription = isEditMode
    ? "قم بتعديل تفاصيل المنتج أدناه."
    : "املأ التفاصيل أدناه لإضافة منتج جديد إلى مخزونك.";
  const submitButtonText = isEditMode ? "حفظ التغييرات" : "إضافة المنتج";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid grid-cols-2 gap-4 py-4">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>الباركود</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Input placeholder="123456789012" {...field} className="pl-20"/>
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={generateBarcodeAndPrint}
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">إنشاء باركود</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={handleManualPrint}
                            disabled={!barcodeValue}
                        >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">طباعة الباركود</span>
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>اسم المنتج</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كاميرا مراقبة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem className="col-span-2">
                  <FormLabel>صورة المنتج</FormLabel>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                      {imagePreview ? (
                        <Image src={imagePreview} alt="Product Preview" width={96} height={96} className="object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="ml-2 h-4 w-4" />
                        تحميل صورة
                      </Button>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        اختر صورة من جهازك. سيتم استخدام صورة افتراضية إذا لم يتم تحديد أي صورة.
                      </p>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>الفئة</FormLabel>
                   <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? categories.find(
                                (category) => category === field.value
                              ) || field.value
                            : "اختر أو أنشئ فئة"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="ابحث عن فئة أو أنشئ..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                               const newCategory = e.currentTarget.value.trim();
                              if(newCategory){
                                form.setValue('category', newCategory, {shouldValidate: true});
                                setComboboxOpen(false);
                                e.preventDefault();
                              }
                            }
                          }}
                        />
                        <CommandEmpty>لم يتم العثور على فئة.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              value={category}
                              key={category}
                              onSelect={() => {
                                form.setValue("category", category, {shouldValidate: true})
                                setComboboxOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المورد</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم المورد" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التكلفة (د.أ)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سعر البيع (د.أ)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="99.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحد الأدنى للسعر (د.أ)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="89.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كمية المخزون</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>حد المخزون المنخفض</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="col-span-2 mt-4">
              <Button type="submit">{submitButtonText}</Button>
            </DialogFooter>
          </form>
        </Form>
        <div className="absolute -left-[9999px] top-0">
            <PrintableBarcode ref={printableComponentRef} barcode={barcodeValue} productName={productNameValue} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
