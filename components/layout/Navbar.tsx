'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-card shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl">
                Shift Editor
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:border-muted-foreground'
                }`}
              >
                ダッシュボード
              </Link>
              <Link
                href="/shifts"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/shifts')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:border-muted-foreground'
                }`}
              >
                シフト
              </Link>
              <Link
                href="/requests"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/requests')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:border-muted-foreground'
                }`}
              >
                シフト希望
              </Link>
              <Link
                href="/attendance"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/attendance')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:border-muted-foreground'
                }`}
              >
                勤怠管理
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  className="flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">ユーザーメニューを開く</span>
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    UT
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-muted"
              aria-expanded="false"
            >
              <span className="sr-only">メニューを開く</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 