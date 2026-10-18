'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

/**
 * Chart compositions for the analytics views, built on the shadcn chart wrapper
 * (T08). Previously these passed raw `hsl(...)` strings to Recharts, including
 * `hsl(var(--primary))` — invalid now that the tokens hold complete colours, so
 * those series rendered in the SVG fallback. Series colours now come from
 * `--chart-1..5`, which are theme-aware by construction.
 */

const areaConfig = {
  views: { label: 'Your Views', color: 'var(--chart-1)' },
  average: { label: 'Platform Average', color: 'var(--chart-5)' },
} satisfies ChartConfig;

interface AreaChartData {
  name: string;
  views: number;
  average?: number;
}

export function TrendAreaChart({ data }: { data: AreaChartData[] }) {
  return (
    <ChartContainer config={areaConfig} className="h-[280px] w-full">
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--color-views)"
          fill="var(--color-views)"
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="average"
          stroke="var(--color-average)"
          fill="var(--color-average)"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const barConfig = {
  value: { label: 'Count', color: 'var(--chart-1)' },
} satisfies ChartConfig;

interface BarChartData {
  name: string;
  value: number;
}

export function EngagementBarChart({ data }: { data: BarChartData[] }) {
  return (
    <ChartContainer config={barConfig} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

const pieConfig = {
  value: { label: 'Audience' },
  '18-24': { label: '18-24', color: 'var(--chart-1)' },
  '25-34': { label: '25-34', color: 'var(--chart-2)' },
  '35-44': { label: '35-44', color: 'var(--chart-3)' },
  '45+': { label: '45+', color: 'var(--chart-4)' },
} satisfies ChartConfig;

interface PieChartData {
  name: string;
  value: number;
}

export function AudiencePieChart({ data }: { data: PieChartData[] }) {
  return (
    <ChartContainer config={pieConfig} className="mx-auto aspect-square h-[280px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={`var(--chart-${(index % 5) + 1})`}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
