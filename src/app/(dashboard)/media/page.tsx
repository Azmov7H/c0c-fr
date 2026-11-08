import { redirect } from 'next/navigation';

// M2-T23: global media library becomes the per-project Media workspace.
// Legacy URL redirects to /projects (no project context at redirect time).
export default function LegacyPage() {
  redirect('/projects');
}
