'use client'

import { useState } from 'react'
import { Supplier } from '@/types/supplier'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, MoreHorizontal } from 'lucide-react'

interface SuppliersClientProps {
  initialData: Supplier[]
  totalCount: number
}

export function SuppliersClient({ initialData, totalCount }: SuppliersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<Supplier[]>(initialData)

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <div className="font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-semibold text-primary">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'gst',
      header: 'GST Number',
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue('gst') || 'N/A'}</div>,
    },
    {
      accessorKey: 'credit_days',
      header: 'Credit Days',
      cell: ({ row }) => <div>{row.getValue('credit_days')} days</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
          }`}>
            {status}
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
            placeholder="Search suppliers..."
            className="flex h-9 w-[150px] lg:w-[250px] rounded-[10px] border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
            Add Supplier
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
                    No suppliers found.
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
