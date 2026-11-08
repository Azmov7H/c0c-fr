import { redirect } from 'next/navigation';

// M2-T22 (project-centric): standalone generation pages consolidate into
// the project workspace Assets tab. Legacy URLs redirect to /projects
// (no project context is known at redirect time). Components preserved.
export default function LegacyPage() {
  redirect('/projects');
}
