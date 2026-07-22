"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Box, 
  Factory, 
  LayoutDashboard, 
  Package, 
  Settings, 
  ShoppingCart, 
  Users 
} from "lucide-react"

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Suppliers', href: '/suppliers', icon: Users },
  { name: 'Warehouses', href: '/warehouses', icon: Box },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border">
      <div className="flex h-16 shrink-0 items-center px-6">
        <span className="text-sm font-semibold tracking-wide">Garment ERP</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-accent text-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon 
                  className={`mr-3 h-4 w-4 shrink-0 stroke-[1.75] ${
                    isActive ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`} 
                  aria-hidden="true" 
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t border-border p-4">
        <Link
          href="/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="mr-3 h-4 w-4 shrink-0 stroke-[1.75]" />
          Settings
        </Link>
      </div>
    </div>
  )
}
