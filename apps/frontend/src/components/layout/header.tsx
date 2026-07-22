"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full flex items-center">
            <Search
              className="absolute inset-y-0 left-0 h-full w-4 text-muted-foreground stroke-[1.75]"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block h-full w-full border-0 py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm bg-transparent outline-none"
              placeholder="Search or jump to... (Cmd+K)"
              type="search"
              name="search"
              autoComplete="off"
            />
            <div className="absolute right-0 flex items-center gap-1 text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded-md">
              <span className="text-[10px]">⌘</span>K
            </div>
          </div>
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground relative group">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5 stroke-[1.75]" aria-hidden="true" />
            <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"></span>
          </button>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
          
          <button type="button" className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border">
              <span className="text-xs font-semibold">MV</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
