'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Hash, Sparkles, Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORIES = ['tech', 'gaming', 'finance', 'lifestyle', 'education', 'fitness', 'food'] as const;

export function HashtagGenerator() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<string>('tech');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setHashtags([
      `#${topic.replace(/\s+/g, '')}`,
      `#${category.charAt(0).toUpperCase() + category.slice(1)}Tips`,
      `#${category.charAt(0).toUpperCase() + category.slice(1)}2026`,
      '#TrendingNow',
      '#ContentCreator',
      '#ViralContent',
      '#ForYouPage',
      '#MustWatch',
      '#AIGenerated',
      '#CreatorEconomy',
    ]);
    setIsGenerating(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.join(' '));
    toast.success('All hashtags copied!');
  };

  const copyOne = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success('Hashtag copied!');
  };

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Hashtag Generator"
        description="Generate trending hashtags optimized for maximum reach."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              Configure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <Label>Topic</Label>
              <Textarea
                placeholder="What's your content about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-3">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="w-full">
              {isGenerating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Generating...' : 'Generate Hashtags'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Generated Hashtags</CardTitle>
            {hashtags.length > 0 && (
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy All
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {hashtags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Hash className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No Hashtags Yet</h3>
                <p className="text-muted-foreground text-sm">Enter a topic and generate trending hashtags.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground font-semibold cursor-pointer transition-all text-sm"
                    onClick={() => copyOne(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
