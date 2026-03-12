import {
    FileText,
    Image as ImageIcon,
    Music,
    BarChart3,
    Search,
    Users,
    Zap,
    ShieldCheck
} from 'lucide-react';

const features = [
    {
        title: 'Neural Scripting',
        description: 'Bypass artistic blocks with contextual AI scripts that sound human, not mechanical.',
        icon: FileText,
        className: 'lg:col-span-2'
    },
    {
        title: 'Cinematic Visuals',
        description: 'Generate production-ready thumbnails in 3D, Realism, or Vector styles.',
        icon: ImageIcon,
        className: 'lg:col-span-1'
    },
    {
        title: 'Atmospheric SFX',
        description: 'AI-composed music and sound effects tailored to your script mood.',
        icon: Music,
        className: 'lg:col-span-1'
    },
    {
        title: 'Viral Predictors',
        description: 'Analytics that predict retention scores before you even publish.',
        icon: BarChart3,
        className: 'lg:col-span-2'
    },
    {
        title: 'Market Intel',
        description: 'Global search trends harvested fresh every minute across all platforms.',
        icon: Search,
        className: 'lg:col-span-1'
    },
    {
        title: 'Team Forge',
        description: 'Cloud-synced workspaces with role-based access for large scale agencies.',
        icon: Users,
        className: 'lg:col-span-1'
    }
];

export const FeaturesGrid = () => {
    return (
        <section className="py-24 container px-4 mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Engineered for Excellence</h2>
                <p className="text-muted-foreground">Every module is a vertical powerhouse designed to scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <div
                        key={i}
                        className={`group p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/20 transition-all duration-500 overflow-hidden relative ${f.className}`}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <f.icon className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <f.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{f.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
