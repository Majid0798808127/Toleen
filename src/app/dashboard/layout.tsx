import { AuthProvider } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>
        <SidebarProvider side="right">
            <Sidebar>
              <SidebarNav />
            </Sidebar>
            <SidebarInset>
                <DashboardHeader />
                <main className="p-4 sm:p-6 lg:p-8">
                  {children}
                </main>
            </SidebarInset>
          </SidebarProvider>
      </DataProvider>
    </AuthProvider>
  );
}
