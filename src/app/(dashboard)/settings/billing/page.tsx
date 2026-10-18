import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { BillingPanel } from "@/features/settings/components/billing-panel"

export const metadata: Metadata = {
  title: "Billing & Plan",
  description: "Your current plan and available upgrades.",
}

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Plan"
        description="Your current plan and what an upgrade would include. Changes are handled by support while self-service billing is being built."
      />
      <BillingPanel />
    </div>
  )
}
