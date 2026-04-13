'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Sparkles, Type } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'blog'] as const;

export function TitleGenerator() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<string>('youtube');
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setGeneratedTitles([
      `The Truth About ${topic} Nobody Talks About`,
      `I Tried ${topic} for 30 Days — Here's What Happened`,
      `${topic}: The Ultimate Guide for 2026`,
      `Why ${topic} Is The Next Big Thing`,
      `Stop Doing ${topic} Wrong — Do This Instead`,
    ]);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Title copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Title Generator"
        description="Generate high-CTR titles optimized for your platform."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Input */}
        <Card className="lg:col-span-4 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              Your Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <Label htmlFor="topic-input">Topic / Subject</Label>
              <Textarea
                id="topic-input"
                placeholder="e.g., AI video editing, content strategy, thumbnail design..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-3">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="w-full">
              {isGenerating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Generating...' : 'Generate Titles'}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="lg:col-span-8 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold">Generated Titles</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {generatedTitles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Type className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No Titles Yet</h3>
                <p className="text-muted-foreground text-sm">Enter your topic and generate optimized titles.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedTitles.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
                        <Badge variant="outline" className="text-[10px]">{platform}</Badge>
                      </div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(title)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
