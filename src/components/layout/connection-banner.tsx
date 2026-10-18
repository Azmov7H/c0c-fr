"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { LoaderCircle, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useRealtimeStatus } from "@/hooks/use-realtime-status"

const RECONNECT_BANNER_DELAY_MS = 3000

function subscribeOnline(callback: () => void) {
    window.addEventListener("online", callback)
    window.addEventListener("offline", callback)
    return () => {
        window.removeEventListener("online", callback)
        window.removeEventListener("offline", callback)
    }
}

/**
 * Single visible surface for transport problems (T10):
 * - browser offline (`navigator.onLine`) → toast once + persistent banner;
 * - socket down but browser online → "reconnecting" banner (only after a
 *   short delay, so a normal page load does not flash a warning).
 *
 * The socket state already flows through useRealtimeStatus (RT-06); this
 * component only renders it — it never opens its own connection.
 */
export function ConnectionBanner() {
    const user = useAuthStore((s) => s.user)
    const status = useRealtimeStatus()
    const online = useSyncExternalStore(
        subscribeOnline,
        () => navigator.onLine,
        () => true // server snapshot: assume online
    )
    const [showReconnecting, setShowReconnecting] = useState(false)
    const reconnectCandidate = !!user && online && status === "connecting"
    const prevOnline = useRef<boolean | null>(null)

    // Toast on real transitions only — skipping the first render so a page
    // load while already offline does not announce something the user knows.
    useEffect(() => {
        if (prevOnline.current === null) {
            prevOnline.current = online
            return
        }
        if (prevOnline.current !== online) {
            if (online) toast.success("Back online")
            else toast.error("You're offline — changes may not save")
            prevOnline.current = online
        }
    }, [online])

    useEffect(() => {
        // Every setState is deferred out of the effect body itself
        // (react-hooks/set-state-in-effect): the flag flips after the delay
        // when a connection is missing, and is cleared on a macrotask when
        // the connection recovers or the page goes offline.
        if (!reconnectCandidate) {
            const reset = setTimeout(() => setShowReconnecting(false), 0)
            return () => clearTimeout(reset)
        }
        const timer = setTimeout(() => setShowReconnecting(true), RECONNECT_BANNER_DELAY_MS)
        return () => clearTimeout(timer)
    }, [reconnectCandidate])

    const offline = !online
    const visible = offline || (reconnectCandidate && showReconnecting)
    if (!visible) return null

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center gap-2 border-b px-4 py-2 text-xs font-medium ${
                offline
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-warning/40 bg-warning/10 text-foreground"
            }`}
        >
            {offline ? (
                <>
                    <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    You&apos;re offline — changes may not save
                </>
            ) : (
                <>
                    <LoaderCircle
                        className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                    />
                    Reconnecting to realtime updates…
                </>
            )}
        </div>
    )
}
