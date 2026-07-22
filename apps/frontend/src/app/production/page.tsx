export default function ProductionPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Production</h2>
      </div>
      <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Under Construction</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            The Production module is being built and will be available in the next sprint.
          </p>
        </div>
      </div>
    </div>
  )
}
