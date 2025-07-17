
"use client";

import { useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PageGuardProps {
  children: ReactNode;
  password?: string;
}

export function PageGuard({ children, password }: PageGuardProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const { toast } = useToast();

  // If no password is required, just render the children
  if (!password) {
    return <>{children}</>;
  }

  const handleVerify = () => {
    if (inputPassword === password) {
      setIsVerified(true);
      toast({ title: 'تم التحقق بنجاح', description: 'تم منح الوصول إلى الصفحة.' });
    } else {
      toast({ title: 'فشل التحقق', description: 'كلمة المرور غير صحيحة.', variant: 'destructive' });
      setInputPassword('');
    }
  };
  
  return (
    <>
      {isVerified ? (
        children
      ) : (
        <Dialog open={!isVerified} onOpenChange={() => {}}>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()}
            className="sm:max-w-[425px]"
            // We hide the close button to force password entry
            hideCloseButton={true} 
            >
            <DialogHeader>
              <DialogTitle>الوصول مطلوب</DialogTitle>
              <DialogDescription>
                هذه الصفحة محمية بكلمة مرور. يرجى إدخال كلمة المرور للمتابعة.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="password-guard" className="sr-only">كلمة المرور</label>
                <Input
                  id="password-guard"
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerify() }}
                  placeholder="أدخل كلمة المرور"
                />
              </div>
            </div>
            <Button onClick={handleVerify} className="w-full">
                دخول
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
