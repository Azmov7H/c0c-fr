'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MockDataBanner } from '@/components/shared/mock-data-banner';
import { MOCK_EVENTS } from '@/lib/dev-mocks';

import {
  Calendar, Clock, CheckCircle2, GripVertical, ArrowUpRight, Plus,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  idea: 'bg-muted text-muted-foreground',
  scripting: 'bg-info/10 text-info',
  editing: 'bg-warning/10 text-warning',
  scheduled: 'bg-success/10 text-success',
};

export function ContentPlanner() {
  const [events] = useState(MOCK_EVENTS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Planner"
        description="Plan and schedule your content calendar."
        actions={
          <Button className="h-9 px-4 rounded-xl shadow-premium hover:shadow-glow transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        }
      />

      <MockDataBanner />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Calendar Grid */}
        <SectionCard
          className="lg:col-span-8"
          title={
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              April 2026
            </span>
          }
        >
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
        </SectionCard>

        {/* Upcoming Events */}
        <div className="lg:col-span-4 space-y-4">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Upcoming
              </span>
            }
            contentClassName="p-3 space-y-2"
          >
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
          </SectionCard>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>{events.filter((e) => e.status === 'scheduled').length} scheduled</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <ArrowUpRight className="w-4 h-4 text-info" />
                <span>{events.filter((e) => e.status === 'scripting').length} in progress</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
