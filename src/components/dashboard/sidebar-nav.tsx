"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Boxes,
  ShoppingCart,
  Wrench,
  LogOut,
  BarChart3,
  BookUser,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/dashboard/pos", label: "نقطة البيع", icon: ShoppingCart },
  { href: "/dashboard/inventory", label: "المخزون", icon: Boxes },
  { href: "/dashboard/maintenance", label: "الصيانة", icon: Wrench },
  { href: "/dashboard/receivables", label: "الذمم", icon: BookUser },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 p-2">
          <Image src="/logo.png" alt="Toleen Logo" width={32} height={32} data-ai-hint="logo" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold font-headline tracking-tight">تولين</h2>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
         <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
        </Button>
      </SidebarFooter>
    </>
  );
}
