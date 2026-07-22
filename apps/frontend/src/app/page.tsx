"use client"

import * as React from "react"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  FileText, 
  Truck, 
  PackageSearch,
  Activity
} from "lucide-react"

export default function Overview() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Good Morning, Mohit 👋</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            <FileText className="mr-2 h-4 w-4 stroke-[1.75]" />
            Invoice
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="mr-2 h-4 w-4 stroke-[1.75]" />
            New Order
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Card 1 */}
        <div className="rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Revenue</h3>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center">
              <ArrowUpRight className="mr-1 h-3 w-3 stroke-[2.5]" />
              +12.5%
            </span>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">₹12.8L</div>
            <p className="text-xs text-muted-foreground mt-1">Compared to last month</p>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Production</h3>
            <FactoryIcon className="h-4 w-4 text-muted-foreground stroke-[1.75]" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">82%</div>
            <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Pending Dispatch</h3>
            <Truck className="h-4 w-4 text-amber-500 stroke-[1.75]" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">148</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-500">Requires attention today</p>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Inventory Alerts</h3>
            <PackageSearch className="h-4 w-4 text-destructive stroke-[1.75]" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground mt-1 text-destructive">Items below minimum threshold</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart Area */}
        <div className="col-span-4 rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Order Fulfillment Timeline</h3>
            <p className="text-sm text-muted-foreground">Average completion time over the last 30 days.</p>
          </div>
          <div className="p-6 pt-0 flex items-center justify-center h-[300px] border-t border-border/50 bg-secondary/5 rounded-b-[18px]">
            <p className="text-sm text-muted-foreground">Chart Component Placeholder</p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-3 rounded-[18px] border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Live Activity Feed</h3>
            <p className="text-sm text-muted-foreground">Real-time system events.</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-6">
              {[
                { time: '10:24 AM', user: 'Rahul', action: 'created Order #1923', type: 'order' },
                { time: '10:12 AM', user: 'System', action: 'updated inventory stock for Fabric A', type: 'inventory' },
                { time: '09:58 AM', user: 'Priya', action: 'marked Invoice #INV-882 as Paid', type: 'finance' },
                { time: '09:44 AM', user: 'Warehouse', action: 'dispatched Shipment #SHP-44', type: 'dispatch' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start">
                  <div className="relative mt-1 mr-4 flex h-2 w-2 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                    {i !== 3 && <div className="absolute top-2 left-1/2 -ml-px h-6 w-px bg-border" />}
                  </div>
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FactoryIcon(props: React.ComponentProps<typeof Activity>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  )
}
