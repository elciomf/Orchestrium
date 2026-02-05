import "../globals.css";
import type { Metadata } from "next";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Theme, ThemeProvider } from "@/components/theme";
import { I18nProviderClient } from "@/locales/client";
import {
  House,
  LayoutDashboard,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Orchestrium",
};

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <I18nProviderClient locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
          >
            <SidebarProvider>
              <Sidebar variant="inset" collapsible="icon">
                <SidebarHeader className="flex flex-row items-center gap-2">
                  <SidebarTrigger />
                  <h1 className="uppercase font-bold select-none truncate group-data-[state=collapsed]:hidden">
                    Orchestrium.sh
                  </h1>
                </SidebarHeader>

                <SidebarContent>
                  <SidebarGroup>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/">
                            <House />
                            <span>Home</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/dashboard">
                            <LayoutDashboard />
                            <span>Dashboard</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup>
                    <SidebarGroupLabel>
                      Resources
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/workflows">
                            <Workflow />
                            <span>Workflows</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                  <Theme />
                </SidebarFooter>
              </Sidebar>
              <Toaster position="top-center" />
              <SidebarInset className="p-4 space-y-4">
                <Navbar />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}
