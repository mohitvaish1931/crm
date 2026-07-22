'use client'

import { useState } from 'react'
import { InventoryItem } from '@/types/inventory'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, MoreHorizontal, Package } from 'lucide-react'

interface InventoryClientProps {
  initialData: InventoryItem[]
  totalCount: number
}

export function InventoryClient({ initialData, totalCount }: InventoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<InventoryItem[]>(initialData)

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <div className="font-medium text-primary">{row.getValue('sku')}</div>,
    },
    {
      accessorKey: 'product',
      header: 'Product Name',
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex items-center">
            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{product?.name || 'Unknown'}</div>
          </div>
        )
      }
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const product = row.original.product
        return <div className="text-muted-foreground">{product?.category?.name || 'N/A'}</div>
      }
    },
    {
      accessorKey: 'stock',
      header: 'Available Stock',
      cell: ({ row }) => {
        const stocks = row.original.current_stocks || []
        const total = stocks.reduce((acc, stock) => acc + (stock.available_qty || 0), 0)
        return (
          <div className={`font-semibold ${total <= 0 ? 'text-destructive' : ''}`}>
            {total} units
          </div>
        )
      },
    },
    {
      accessorKey: 'price',
      header: 'Unit Price',
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price') || '0')
        const formatted = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(price)
        return <div>{formatted}</div>
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
          }`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <button className="h-8 w-8 p-0 rounded-md hover:bg-accent flex items-center justify-center">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <input
            placeholder="Search SKU..."
            className="flex h-9 w-[150px] lg:w-[250px] rounded-[10px] border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={searchParams.get('search') ?? ''}
            onChange={(event) => {
              const params = new URLSearchParams(searchParams)
              if (event.target.value) {
                params.set('search', event.target.value)
              } else {
                params.delete('search')
              }
              params.set('page', '1')
              router.push(`?${params.toString()}`)
            }}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-[10px] px-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="rounded-[18px] border border-border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing page {searchParams.get('page') || 1}
        </div>
        <div className="space-x-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-[10px] px-3">
            Previous
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-[10px] px-3">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
