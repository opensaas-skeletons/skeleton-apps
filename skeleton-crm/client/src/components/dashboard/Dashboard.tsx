import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import type { DashboardSummary, PipelineFunnelEntry, ActivitySummary, RecentDeal, WinRateEntry, Pipeline } from "@shared/types/crm";
import * as api from "../../api/client";

const ACTIVITY_COLORS: Record<string, string> = {
  call: "#3b82f6",
  email: "#8b5cf6",
  meeting: "#f59e0b",
  note: "#22c55e",
  task: "#ef4444",
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnelEntry[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([]);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [winRate, setWinRate] = useState<WinRateEntry[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary().then(setSummary),
      api.getActivitySummary().then(setActivitySummary),
      api.getRecentDeals().then(setRecentDeals),
      api.getWinRate().then(setWinRate),
      api.listPipelines().then((ps) => {
        setPipelines(ps);
        const defaultP = ps.find((p) => p.is_default) || ps[0];
        if (defaultP) setSelectedPipelineId(defaultP.id);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      api.getPipelineFunnel(selectedPipelineId).then(setFunnel).catch(console.error);
    }
  }, [selectedPipelineId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-surface-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const summaryCards = summary ? [
    { label: "Contacts", value: summary.total_contacts, color: "text-brand-600" },
    { label: "Companies", value: summary.total_companies, color: "text-purple-600" },
    { label: "Open Deals", value: summary.open_deals, color: "text-blue-600" },
    { label: "Won Deals", value: summary.won_deals, color: "text-green-600" },
    { label: "Pipeline Value", value: formatCurrency(summary.total_pipeline_value), color: "text-amber-600" },
    { label: "Weighted Value", value: formatCurrency(summary.weighted_pipeline_value), color: "text-brand-600" },
  ] : [];

  const statusColors: Record<string, string> = {
    open: "text-blue-600",
    won: "text-green-600",
    lost: "text-red-600",
  };

  return (
    <div className="flex-1 p-5 space-y-6 overflow-y-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-card p-4">
            <p className="text-xs text-surface-500 font-medium">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-700">Pipeline Funnel</h3>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="text-xs border border-surface-300 rounded px-2 py-1 bg-white"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          {funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="stage_title" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "total_value" ? formatCurrency(value) : value
                  }
                />
                <Bar dataKey="deal_count" fill="#3b82f6" name="Deals" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No data</p>
          )}
        </div>

        {/* Activity Breakdown */}
        <div className="bg-white rounded-lg shadow-card p-5">
          <h3 className="text-sm font-semibold text-surface-700 mb-4">Activity Breakdown (30 days)</h3>
          {activitySummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activitySummary}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ type, count }) => `${type} (${count})`}
                >
                  {activitySummary.map((entry) => (
                    <Cell key={entry.type} fill={ACTIVITY_COLORS[entry.type] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No activities in the last 30 days</p>
          )}
        </div>

        {/* Win Rate Chart */}
        <div className="bg-white rounded-lg shadow-card p-5">
          <h3 className="text-sm font-semibold text-surface-700 mb-4">Win Rate Over Time</h3>
          {winRate.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...winRate].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="win_rate" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No closed deals yet</p>
          )}
        </div>

        {/* Recent Deals */}
        <div className="bg-white rounded-lg shadow-card p-5">
          <h3 className="text-sm font-semibold text-surface-700 mb-4">Recent Deals</h3>
          {recentDeals.length > 0 ? (
            <div className="space-y-2">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate">{deal.title}</p>
                    <p className="text-xs text-surface-400">
                      {deal.stage_title}
                      {deal.company_name ? ` \u00b7 ${deal.company_name}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-surface-700">{formatCurrency(deal.value)}</p>
                    <p className={`text-xs font-medium ${statusColors[deal.status] || ""}`}>{deal.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">No deals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
