import { AuthProvider } from '@/contexts/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <div className="flex flex-col items-center space-y-4">
          <Image src="/logo.png" alt="Toleen Logo" width={150} height={150} data-ai-hint="logo" />
          <h1 className="text-5xl font-bold font-headline text-primary">تولين</h1>
          <p className="text-muted-foreground">
            موبايل | كاميرات مراقبه | كمبيوتر
          </p>
        </div>
        <LoginForm />
      </main>
    </AuthProvider>
  );
}
