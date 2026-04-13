'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon, Music, Video, FileAudio, FileImage,
  Upload, Search, Copy, Trash2, Play, X,
} from 'lucide-react';
import Image from 'next/image';

const MOCK_ASSETS = [
  { id: '1', name: 'hero-banner.png', type: 'image', url: '/placeholder.png', size: '2.4 MB', date: '2026-04-10', tags: ['banner', 'hero'] },
  { id: '2', name: 'intro-clip.mp4', type: 'video', url: '', size: '14.1 MB', date: '2026-04-09', tags: ['intro', 'clip'] },
  { id: '3', name: 'bg-music.mp3', type: 'audio', url: '', size: '3.2 MB', date: '2026-04-08', tags: ['music', 'background'] },
  { id: '4', name: 'thumbnail-v1.png', type: 'image', url: '/placeholder.png', size: '890 KB', date: '2026-04-07', tags: ['thumbnail'] },
  { id: '5', name: 'outro-transition.mp4', type: 'video', url: '', size: '5.6 MB', date: '2026-04-06', tags: ['outro'] },
  { id: '6', name: 'sfx-whoosh.mp3', type: 'audio', url: '', size: '120 KB', date: '2026-04-05', tags: ['sfx', 'transition'] },
];

const assetIcons: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: FileAudio,
};

export function MediaLibrary() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<typeof MOCK_ASSETS[0] | null>(null);

  const filtered = MOCK_ASSETS.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some((t) => t.includes(search.toLowerCase()));
    const matchTab = activeTab === 'all' || a.type === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Media Library"
        description="Manage all your media assets — images, videos, and audio files."
        ctaLabel="Upload"
        onCtaClick={() => {}}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search assets..."
        filters={[]}
        onClear={() => { setSearch(''); setActiveTab('all'); }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {filtered.map((asset) => {
                const Icon = assetIcons[asset.type] || ImageIcon;
                return (
                  <Card
                    key={asset.id}
                    className="border-border/50 hover:border-primary/30 hover:shadow-premium transition-all cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted/40 flex items-center justify-center relative">
                        {asset.type === 'image' && asset.url ? (
                          <Image src={asset.url} alt={asset.name} fill className="object-cover" />
                        ) : (
                          <Icon className="w-10 h-10 text-muted-foreground/40" />
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {asset.type === 'video' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground">{asset.size}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset Preview Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(o) => !o && setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAsset.name}</DialogTitle>
                <DialogDescription>
                  {selectedAsset.type.toUpperCase()} · {selectedAsset.size} · {selectedAsset.date}
                </DialogDescription>
              </DialogHeader>
              <div className="aspect-video bg-muted/40 rounded-lg flex items-center justify-center">
                {selectedAsset.type === 'image' && selectedAsset.url ? (
                  <Image src={selectedAsset.url} alt={selectedAsset.name} fill className="object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    {(() => {
                      const IconComponent = assetIcons[selectedAsset.type]
                      return IconComponent ? (
                        <IconComponent className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                      ) : null
                    })()}
                    <p className="text-muted-foreground">Preview not available</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAsset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
