'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Area Chart (Views Over Time) ─────────────────────────────────────────────
interface AreaChartData {
  name: string;
  views: number;
  average?: number;
}

export function TrendAreaChart({ data }: { data: AreaChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(238, 82%, 67%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(238, 82%, 67%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(240, 5%, 65%)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(240, 5%, 65%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Area
          type="monotone"
          dataKey="views"
          name="Your Views"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorViews)"
        />
        {data[0]?.average !== undefined && (
          <Area
            type="monotone"
            dataKey="average"
            name="Platform Avg"
            stroke="hsl(var(--muted-foreground))"
            fillOpacity={1}
            fill="url(#colorAvg)"
            strokeDasharray="5 5"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Bar Chart (Engagement Funnel) ────────────────────────────────────────────
interface BarChartData {
  name: string;
  value: number;
}

export function EngagementBarChart({ data }: { data: BarChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Pie Chart (Audience Demographics) ────────────────────────────────────────
interface PieChartData {
  name: string;
  value: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(38, 92%, 50%)',
  'hsl(270, 70%, 60%)',
  'hsl(0, 84%, 60%)',
];

export function AudiencePieChart({ data }: { data: PieChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
          outerRadius={90}
          fill="hsl(var(--primary))"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Line Chart (Growth Comparison) ───────────────────────────────────────────
interface LineChartData {
  name: string;
  thisYear: number;
  lastYear: number;
}

export function GrowthLineChart({ data }: { data: LineChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="thisYear"
          name="This Year"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="lastYear"
          name="Last Year"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
