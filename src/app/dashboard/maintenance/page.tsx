"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { MaintenanceJob } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import { AddJobDialog, JobFormValues } from '@/components/maintenance/add-job-dialog';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<MaintenanceJob['status'], string> = {
  Received: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Completed: 'bg-green-500',
  'Awaiting Collection': 'bg-purple-500',
};

const statusTranslations: Record<MaintenanceJob['status'], string> = {
  Received: 'تم الاستلام',
  'In Progress': 'قيد التنفيذ',
  Completed: 'مكتمل',
  'Awaiting Collection': 'بانتظار الاستلام',
};

export default function MaintenancePage() {
  const { maintenanceJobs, updateMaintenanceJob, addMaintenanceJob } = useData();
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = (jobId: string, newStatus: MaintenanceJob['status']) => {
    updateMaintenanceJob(jobId, { status: newStatus });
  };
  
  const handleSubmitJob = (data: JobFormValues) => {
    addMaintenanceJob(data);
    setIsAddJobDialogOpen(false);
  }

  const filteredJobs = useMemo(() => {
    if (!filterDate) return maintenanceJobs;
    return maintenanceJobs.filter(job => job.dateReceived === format(filterDate, 'yyyy-MM-dd'));
  }, [maintenanceJobs, filterDate]);

  const activeJobs = useMemo(() => {
    return filteredJobs.filter(j => j.status === 'Received' || j.status === 'In Progress');
  }, [filteredJobs]);

  const completedJobs = useMemo(() => {
    return filteredJobs.filter(j => j.status === 'Completed' || j.status === 'Awaiting Collection');
  }, [filteredJobs]);

  const renderJobsTable = (jobsToRender: MaintenanceJob[], isCompletedTab: boolean) => (
    <Card className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>معرف الطلب</TableHead>
            <TableHead>العميل</TableHead>
            <TableHead>المنتج</TableHead>
            <TableHead>المشكلة</TableHead>
            <TableHead>تاريخ الاستلام</TableHead>
            {isCompletedTab && <TableHead>تاريخ الإنجاز</TableHead>}
            <TableHead>التكلفة</TableHead>
            <TableHead>ملاحظات</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobsToRender.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono font-code">{job.id}</TableCell>
              <TableCell className="font-medium">{job.customerName}</TableCell>
              <TableCell>{job.productName}</TableCell>
              <TableCell className="max-w-[200px] truncate">{job.issueDescription}</TableCell>
              <TableCell>{job.dateReceived}</TableCell>
              {isCompletedTab && <TableCell>{job.completionDate || '-'}</TableCell>}
              <TableCell>{job.cost.toFixed(2)} د.أ</TableCell>
              <TableCell className="max-w-[200px] truncate">{job.notes || '-'}</TableCell>
              <TableCell>
                <Select
                  value={job.status}
                  onValueChange={(value: MaintenanceJob['status']) => handleStatusChange(job.id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue>
                       <div className='flex items-center gap-2'>
                         <span className={`h-2 w-2 rounded-full ${statusColors[job.status]}`} />
                         {statusTranslations[job.status]}
                       </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className='flex items-center gap-2'>
                         <span className={`h-2 w-2 rounded-full ${statusColors[status as MaintenanceJob['status']]}`} />
                         {statusTranslations[status as MaintenanceJob['status']]}
                       </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">تتبع الصيانة</h1>
        <Button onClick={() => setIsAddJobDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة طلب جديد
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>فلترة حسب تاريخ الاستلام</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
                />
            </PopoverContent>
        </Popover>
        {filterDate && <Button variant="ghost" onClick={() => setFilterDate(undefined)}>إلغاء الفلتر</Button>}
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
            <TabsTrigger value="active">الطلبات الحالية</TabsTrigger>
            <TabsTrigger value="completed">الطلبات المكتملة</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
            {renderJobsTable(activeJobs, false)}
        </TabsContent>
        <TabsContent value="completed">
            {renderJobsTable(completedJobs, true)}
        </TabsContent>
      </Tabs>
      <AddJobDialog 
        open={isAddJobDialogOpen}
        onOpenChange={setIsAddJobDialogOpen}
        onSubmit={handleSubmitJob}
      />
    </div>
  );
}
