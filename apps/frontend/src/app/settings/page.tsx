export const metadata = {
  title: 'Settings | ERP',
  description: 'Manage workspace settings and users',
}

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace, users, and billing.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-[18px] border border-border bg-card p-6">
          <div className="flex flex-col space-y-8">
            <div>
              <h3 className="text-lg font-medium">Profile</h3>
              <p className="text-sm text-muted-foreground">
                This is how others will see you on the site.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Username
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="mohitvaish"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is your public display name.
                  </p>
                </div>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Update profile
                </button>
              </div>
            </div>
            
            <div className="h-[1px] bg-border" />
            
            <div>
              <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                Irreversible actions for your workspace.
              </p>
              <div className="mt-4">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 text-destructive">
                  Delete Workspace
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 rounded-[18px] border border-border bg-card p-6">
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Invite and manage users in your workspace.
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  M
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Mohit Vaish</p>
                  <p className="text-sm text-muted-foreground">Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
