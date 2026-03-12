import React from 'react';

export function HeavyChart() {
    return (
        <div className="w-full h-[300px] flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/50">
            <p className="text-muted-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Chart visualization loaded dynamically
            </p>
        </div>
    );
}
