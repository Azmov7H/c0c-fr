"use client"

import { FileText, ImageIcon, Music } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    WorkspaceEmpty
} from "./workspace-empty"
import { ScriptEditor } from "@/features/scripts/components/script-editor"
import { ThumbnailGenerator } from "@/features/thumbnails/components/thumbnail-generator"
const TABS = [
    { value: "script", label: "Script", icon: FileText },
    { value: "thumbnails", label: "Visuals", icon: ImageIcon },
    { value: "audio", label: "Audio", icon: Music },
]

export function WorkspaceTabs({
    activeScript,
    onGenerate,
    isGenerating
}: any) {

    return (
        <Tabs defaultValue="script">

            <TabsList>
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            <TabsContent value="script">
                {!activeScript ? (
                    <WorkspaceEmpty
                        onGenerate={onGenerate}
                        loading={isGenerating}
                    />
                ) : (
                    <ScriptEditor scriptId={activeScript.id} />
                )}
            </TabsContent>

            <TabsContent value="thumbnails">
                {activeScript ? (
                    <ThumbnailGenerator projectId={activeScript.projectId} />
                ) : (
                    <WorkspaceEmpty
                        onGenerate={onGenerate}
                        loading={isGenerating}
                    />
                )}
            </TabsContent>

        </Tabs>
    )
}