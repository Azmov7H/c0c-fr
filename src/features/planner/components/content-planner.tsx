'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, CalendarDays, Clock, Plus, CheckCircle2, GripVertical, ArrowUpRight,
} from 'lucide-react';

const MOCK_EVENTS = [
  { id: '1', title: 'YouTube Shorts Batch', date: '2026-04-14', status: 'editing', platform: 'YouTube' },
  { id: '2', title: 'TikTok Trend Response', date: '2026-04-15', status: 'scripting', platform: 'TikTok' },
  { id: '3', title: 'Instagram Reel Campaign', date: '2026-04-17', status: 'scheduled', platform: 'Instagram' },
  { id: '4', title: 'Long-form Deep Dive', date: '2026-04-20', status: 'idea', platform: 'YouTube' },
  { id: '5', title: 'Product Review Video', date: '2026-04-22', status: 'scripting', platform: 'TikTok' },
];

const statusColors: Record<string, string> = {
  idea: 'bg-muted text-muted-foreground',
  scripting: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  editing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  scheduled: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export function ContentPlanner() {
  const [events] = useState(MOCK_EVENTS);

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Content Planner"
        description="Plan and schedule your content calendar."
        ctaLabel="New Event"
        onCtaClick={() => {}}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Calendar Grid */}
        <Card className="lg:col-span-8 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              April 2026
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
                const dayEvents = events.filter((e) => e.date === dateStr);
                const isToday = day === 13;
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] rounded-lg border p-1.5 text-xs transition-colors ${
                      isToday
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/20'
                    }`}
                  >
                    <span className={`font-medium ${isToday ? 'text-primary font-bold' : ''}`}>{day}</span>
                    <div className="space-y-1 mt-1">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-1 text-[10px] p-1 rounded bg-primary/10 text-primary truncate cursor-pointer"
                        >
                          <GripVertical className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {events.slice(0, 5).map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="text-center shrink-0 w-10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      {new Date(ev.date).toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-base font-black leading-none">
                      {new Date(ev.date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1 font-semibold">{ev.platform}</Badge>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[ev.status]}`}>
                        {ev.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{events.filter((e) => e.status === 'scheduled').length} scheduled</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                <span>{events.filter((e) => e.status === 'scripting').length} in progress</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
