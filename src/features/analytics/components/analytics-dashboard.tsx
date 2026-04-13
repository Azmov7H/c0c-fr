'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp, Users, Eye, BarChart3, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { TrendAreaChart, EngagementBarChart, AudiencePieChart } from '@/components/shared/charts';

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('7d');

  const stats = [
    { label: 'Total Views', value: '2.4M', trend: '+18%', trendUp: true, icon: Eye, iconColor: 'text-blue-500' },
    { label: 'Engagement Rate', value: '8.7%', trend: '+2.1%', trendUp: true, icon: TrendingUp, iconColor: 'text-emerald-500' },
    { label: 'Avg. Watch Time', value: '3:42', trend: '-0.8%', trendUp: false, icon: BarChart3, iconColor: 'text-amber-500' },
    { label: 'Subscribers', value: '12.4K', trend: '+840', trendUp: true, icon: Users, iconColor: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <FeatureHeader
          title="Analytics"
          description="Track your content performance across all platforms."
        />
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-9 w-40 rounded-xl">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Performance Chart — Real Recharts */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-base font-bold">Views Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Cross-platform view count trend</p>
          </div>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold text-[10px]">
            <ArrowUpRight className="w-3 h-3 mr-1" /> +18%
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <TrendAreaChart
            data={[
              { name: 'Mon', views: 35000, average: 28000 },
              { name: 'Tue', views: 55000, average: 32000 },
              { name: 'Wed', views: 40000, average: 30000 },
              { name: 'Thu', views: 70000, average: 35000 },
              { name: 'Fri', views: 60000, average: 38000 },
              { name: 'Sat', views: 85000, average: 42000 },
              { name: 'Sun', views: 75000, average: 40000 },
              { name: 'Mon', views: 90000, average: 45000 },
              { name: 'Tue', views: 65000, average: 43000 },
              { name: 'Wed', views: 80000, average: 46000 },
              { name: 'Thu', views: 95000, average: 48000 },
              { name: 'Fri', views: 70000, average: 47000 },
              { name: 'Sat', views: 88000, average: 50000 },
              { name: 'Sun', views: 92000, average: 52000 },
            ]}
          />
        </CardContent>
      </Card>

      {/* Engagement Funnel */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-bold">Engagement Funnel</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Impressions → Clicks → Watch Duration</p>
        </CardHeader>
        <CardContent className="p-4">
          <EngagementBarChart
            data={[
              { name: 'Impressions', value: 1200000 },
              { name: 'Clicks', value: 480000 },
              { name: 'Avg. View\nDuration', value: 185000 },
            ]}
          />
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold">Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              { title: 'AI Content Strategy 2026', views: '847K', growth: '+42%' },
              { title: 'Viral Hook Masterclass', views: '623K', growth: '+28%' },
              { title: 'Thumbnail Design Secrets', views: '412K', growth: '+15%' },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.views} views</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold text-xs">
                  <ArrowUpRight className="w-3 h-3 mr-1" />{item.growth}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold">Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AudiencePieChart
              data={[
                { name: '18-24', value: 32 },
                { name: '25-34', value: 41 },
                { name: '35-44', value: 18 },
                { name: '45+', value: 9 },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
