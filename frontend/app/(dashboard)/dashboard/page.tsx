export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-card-foreground">
          Welcome Back 👋
        </h2>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Manage your projects, tasks, users, and team activities from one
          place. Stay organized and keep your work moving efficiently.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Projects</p>

          <h3 className="mt-3 text-3xl font-bold text-card-foreground">
            0
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Active projects
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Tasks</p>

          <h3 className="mt-3 text-3xl font-bold text-card-foreground">
            0
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Total tasks
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Users</p>

          <h3 className="mt-3 text-3xl font-bold text-card-foreground">
            0
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Registered users
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Completed</p>

          <h3 className="mt-3 text-3xl font-bold text-card-foreground">
            0%
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Task completion
          </p>
        </div>
      </div>
    </div>
  );
}