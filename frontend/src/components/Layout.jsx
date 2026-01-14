import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Ürün Kataloğu', icon: Package },
  { path: '/quotes', label: 'Teklifler', icon: FileText },
  { path: '/bank-accounts', label: 'Banka Hesapları', icon: CreditCard },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
  { path: '/subscription', label: 'Abonelik', icon: Building2 },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="main-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">QuoteMaster</span>
            </Link>
            <button
              className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path.replace('/', '')}`}
                    className={`nav-item ${isActive ? 'active' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                {user?.company_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.company_name}</p>
                <p className="text-white/60 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Ana Sayfa</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="font-medium text-slate-900">{currentPage}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user?.subscription_status === 'trial' && (
              <Link to="/subscription">
                <span className="badge-pending">Deneme Sürümü</span>
              </Link>
            )}
            {user?.subscription_status === 'active' && (
              <span className="badge-success">Pro</span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
