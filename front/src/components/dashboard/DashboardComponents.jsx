import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui";
import { Download, LayoutDashboard, Database, Sprout, ClipboardCheck, ArrowUpRight, TrendingUp } from "lucide-react";
import { MOCK_ACTIVITY } from "../../data/constants";

export function SummaryCards() {
  const cards = [
    {
      label: "Wine batches",
      value: "128",
      change: "+6 added this month",
      icon: Database,
      iconColor: "text-primary",
    },
    {
      label: "Cellar inventory",
      value: "186,400",
      unit: "L",
      change: "+8.4% vs. last month",
      changeColor: "text-success",
      icon: LayoutDashboard,
      iconColor: "text-primary",
    },
    {
      label: "Registered vineyards",
      value: "12",
      change: "Across 3 estate zones",
      icon: Sprout,
      iconColor: "text-primary",
    },
    {
      label: "Pending reviews",
      value: "8",
      change: "Quality checks to complete",
      icon: ClipboardCheck,
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} variant="bordered" padding="lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-md text-text-muted">{card.label}</p>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex-center">
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <CardTitle className="text-5xl font-semibold text-text flex items-baseline gap-2">
              {card.value}
              {card.unit && <span className="text-2xl font-normal text-text-muted">{card.unit}</span>}
            </CardTitle>
            <CardDescription className={card.changeColor}>{card.change}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function InventoryChart() {
  return (
    <Card variant="bordered" padding="lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <CardTitle>Cellar inventory over time</CardTitle>
          <CardDescription>Total registered wine volume ? litres</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <span className="w-8 h-1 bg-primary" />
            Wine inventory
          </span>
          <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-hover transition-colors flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Last 6 months
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-neutral-50 rounded-lg flex-center text-text-muted">
          <span>Chart placeholder - Recharts integration needed</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivity() {
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <CardHeader className="px-6 py-4 flex items-center justify-between border-b border-border">
        <CardTitle>Recent activity</CardTitle>
        <button className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          View activity log
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <div className="divide-y divide-border">
        {MOCK_ACTIVITY.map((activity) => (
          <div key={activity.id} className="px-6 py-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex-center flex-shrink-0">
              {activity.type === "updated" && (
                <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              )}
              {activity.type === "created" && (
                <svg className="h-3.5 w-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              )}
              {activity.type === "approved" && (
                <svg className="h-3.5 w-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{activity.description}</p>
              <p className="text-xs text-text-muted truncate">{activity.details}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted hidden sm:flex">
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5 bg-primary-light text-primary rounded-full flex-center text-xs" ><circle cx="8" cy="8" r="6" /></svg>
                {activity.author.nombre}
              </span>
              <span className="w-24 text-right">{activity.timestamp}</span>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === "aging" ? "bg-primary-light text-primary" :
                activity.status === "fermenting" ? "bg-warning-light text-warning" :
                activity.status === "ready" ? "bg-success-light text-success" :
                "bg-border text-text-muted"
              }`}>
                {activity.type === "updated" && "Updated"}
                {activity.type === "created" && "Created"}
                {activity.type === "approved" && "Approved"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
