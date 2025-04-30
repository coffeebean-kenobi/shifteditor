'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: { title: string; href: string }[];
};

export function AdminSidebar() {
  const pathname = usePathname() || '';
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

  const sidebarItems: SidebarItem[] = [
    {
      title: 'ダッシュボード',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'スタッフ管理',
      href: '/admin/staff',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'シフト管理',
      href: '/admin/shifts',
      icon: <Calendar className="h-5 w-5" />,
      submenu: [
        { title: 'シフト作成', href: '/admin/shifts' },
        { title: 'シフト希望一覧', href: '/admin/shifts/requests' },
        { title: '交代申請', href: '/admin/shifts/swaps' },
      ],
    },
    {
      title: '勤怠管理',
      href: '/admin/attendance',
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      title: '設定',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(openSubmenu === href ? null : href);
  };

  return (
    <div className="w-64 bg-card h-full border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">管理パネル</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <li key={item.href} className="font-medium">
              {item.submenu ? (
                <>
                  <button
                    className={`flex items-center w-full p-3 rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleSubmenu(item.href)}
                  >
                    {item.icon}
                    <span className="ml-3 flex-1">{item.title}</span>
                    {openSubmenu === item.href ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {openSubmenu === item.href && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.href}>
                          <Link
                            href={subitem.href}
                            className={`flex items-center p-2 pl-9 rounded-md transition-colors ${
                              pathname === subitem.href
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {subitem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t text-sm text-muted-foreground">
        <p>Shift Editor 管理パネル</p>
        <p>v1.0.0</p>
      </div>
    </div>
  );
} 