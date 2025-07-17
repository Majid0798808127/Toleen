
"use client";

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { LogOut } from "lucide-react";
import type { User } from "@/lib/types";

const roleTranslations: Record<User['role'], string> = {
    admin: 'مدير',
    cashier: 'كاشير',
    technician: 'فني',
};

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const [dateTime, setDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const timerId = setInterval(() => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
       <div className="md:hidden">
         <SidebarTrigger />
       </div>
       <div className="flex-1">
        {dateTime.date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{dateTime.date}</span>
            <span>|</span>
            <span className="font-mono font-code tracking-wider">{dateTime.time}</span>
          </div>
        )}
       </div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.role === 'admin' ? '/logo.png' : `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {roleTranslations[user.role]}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
    </header>
  );
}
