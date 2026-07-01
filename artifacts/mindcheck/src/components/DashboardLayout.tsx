import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, LayoutDashboard, FileText, User, LogOut, Menu, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = user?.is_admin ? [
    { label: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  ] : [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "New Assessment", path: "/assessment", icon: FileText },
    { label: "Progress", path: "/progress", icon: BarChart3 },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r w-64 p-4">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
          MC
        </div>
        <span className="text-xl font-bold text-foreground">MindCheck AI</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} onClick={() => setOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t">
        <div className="px-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground truncate">{user?.full_name}</span>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-card flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            MC
          </div>
          <span className="text-lg font-bold">MindCheck</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <main className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
