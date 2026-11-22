import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import arWorkspace from '../../../messages/ar/workspace.json';
import enWorkspace from '../../../messages/en/workspace.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';
import { EN_STAGE_MESSAGES, WORKFLOW_STAGES } from './lib/stages';

/**
 * AR-031 — the workspace surface (shell, tabs, assets, members, activity,
 * export, preview, workflow and the mounted media panel).
 *
 * The proofs every extraction makes:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in a `.tsx` source;
 *   2. the `.ts` seams carry no stray English literals (the scanner only sees
 *      `.tsx` text nodes and copy attributes);
 *   3. the ENGLISH is verbatim what the components rendered before AR-031;
 *   4. the ARABIC is really Arabic — nothing empty, nothing a copy of English;
 *   5. every placeholder survives, and no value uses a bare `#` (which would
 *      flip the Latin digits the locale deliberately keeps).
 */
const SURFACE = [
    'src/features/projects/components/workspace/workspace-header.tsx',
    'src/features/projects/components/workspace/workspace-tabs.tsx',
    'src/features/projects/components/workspace/assets-tab.tsx',
    'src/features/projects/components/workspace/members-tab.tsx',
    'src/features/projects/components/workspace/activity-tab.tsx',
    'src/features/projects/components/workspace/project-export.tsx',
    'src/features/projects/components/workspace/preview-panel.tsx',
    'src/features/projects/components/workspace/workflow-stepper.tsx',
    'src/features/projects/components/workspace/workspace-not-found.tsx',
    'src/features/projects/components/workspace/workspace-skeleton.tsx',
    'src/features/projects/components/workspace/project-workspace.tsx',
    'src/features/projects/components/workspace/media-tab.tsx',
    'src/features/media/components/media-workspace/media-workspace.tsx',
    'src/features/billing/components/generation-indicator.tsx',
];

/** `.ts` seams whose English lives in the catalog or the pinned floor bag. */
const TS_SEAMS = [
    'src/features/projects/lib/workspace-labels.ts',
    'src/features/projects/hooks/use-collaboration.ts',
    'src/features/projects/hooks/use-workflow-stages.ts',
];

const FLOOR = {
    "shell": {
      "loadErrorTitle": "Could not load this project",
      "loadErrorFallback": "Try again in a moment.",
      "retry": "Retry"
    },
    "notFound": {
      "title": "Project not found",
      "description": "This project is unavailable, or the link may be incorrect.",
      "back": "Back to projects"
    },
    "skeleton": {
      "loading": "Loading project"
    },
    "tabs": {
      "loading": "Loading tab",
      "assets": "Assets",
      "media": "Media",
      "preview": "Preview",
      "members": "Members",
      "activity": "Activity"
    },
    "header": {
      "breadcrumb": "Breadcrumb",
      "dashboard": "Dashboard",
      "projects": "Projects",
      "titleAria": "Project title",
      "editTitleAria": "Edit project title: {title}",
      "updated": "Updated {time}",
      "created": "Created {time}",
      "restore": "Restore",
      "archive": "Archive",
      "actionsAria": "Project actions",
      "duplicate": "Duplicate project",
      "duplicateTitle": "{title} (copy)",
      "statusMarked": "Project marked {status}.",
      "markAs": "Mark as {status}",
      "remove": "Remove…",
      "idea": "Project idea",
      "archiveTitle": "Archive “{title}”?",
      "archiveDescription": "It moves to the project archive and leaves the active list. You can restore it to drafts later.",
      "keepActive": "Keep active",
      "archiveProject": "Archive project"
    },
    "workflow": {
      "loading": "Loading workflow stages",
      "aria": "Production workflow",
      "stageAria": "{label} — {state}",
      "states": {
        "completed": "completed",
        "blocked": "blocked",
        "current": "current step",
        "notStarted": "not started"
      },
      "stages": {
        "creation": {
          "label": "Project",
          "detail": "{title}",
          "empty": "No project loaded"
        },
        "configuration": {
          "label": "Configuration",
          "detail": "{platform} · {tone}{duration}",
          "duration": " · {seconds}s",
          "empty": "Not configured"
        },
        "script": {
          "label": "Script",
          "detail": "{scenes} scene(s) · version {version}",
          "empty": "No script yet"
        },
        "scriptEdit": {
          "label": "Script edit",
          "blocked": "Generate the script first",
          "edited": "Edited · version {version}",
          "notEdited": "Not edited yet · version {version}",
          "empty": "No script to edit"
        },
        "thumbnail": {
          "label": "Thumbnail",
          "ready": "Thumbnail ready",
          "empty": "No thumbnail yet"
        },
        "sceneImages": {
          "label": "Scene images",
          "detail": "{filled} of {slots} image slot(s) filled"
        },
        "narration": {
          "label": "Narration",
          "ready": "Narration ready",
          "empty": "No narration yet"
        },
        "sfx": {
          "label": "Sound effects",
          "detail": "{count} effect layer(s) ready",
          "empty": "No sound effects yet"
        },
        "preview": {
          "label": "Preview",
          "blocked": "Finish the asset stages to preview the whole project",
          "ready": "Everything is in place",
          "partial": "Shows what exists so far"
        },
        "export": {
          "label": "Export",
          "blocked": "Generate a script to export",
          "ready": "Exported at least once",
          "empty": "Not exported yet"
        }
      }
    },
    "preview": {
      "loading": "Loading preview",
      "emptyTitle": "Nothing to preview yet",
      "emptyDescription": "Generate a script and some assets — they appear here as they land.",
      "stillMissing": "Still missing: {list}. The preview shows what exists so far.",
      "thumbnailTitle": "Thumbnail",
      "thumbnailDescription": "The project's cover image.",
      "thumbnailAlt": "Project thumbnail",
      "imagesTitle": "Scene images",
      "imageAlt": "Scene image",
      "scriptTitle": "Script",
      "scriptVersion": "v{version}",
      "scriptDetail": "{scenes} scene(s) · {words} words",
      "narrationTitle": "Narration",
      "narrationAria": "Narration playback",
      "missing": {
        "script": "script",
        "thumbnail": "thumbnail",
        "sceneImages": "scene images",
        "narration": "narration"
      }
    },
    "assets": {
      "loading": "Loading assets",
      "projectTitle": "Project",
      "generate": "Generate",
      "quotaFallback": "Generation quota exhausted.",
      "quotaTitle": "Generation quota reached",
      "quotaCta": "Upgrade for more generations",
      "creditTitle": "Not enough credits",
      "creditCta": "Top up or upgrade to continue",
      "viewerNote": "Your role can view assets but not generate or change them.",
      "scripts": {
        "title": "Scripts",
        "description": "Structured per-scene scripts for this project.",
        "empty": "No scripts yet. {hint}",
        "emptyEditor": "Generate the first one.",
        "emptyViewer": "An editor can generate one.",
        "version": "Version {version} · {scenes} scene(s)",
        "words": "{count} words"
      },
      "thumbnails": {
        "title": "Thumbnails",
        "description": "Visual concepts generated from your idea.",
        "empty": "No thumbnails yet."
      },
      "audio": {
        "title": "Audio",
        "description": "Music and sound-effect suggestions.",
        "empty": "No audio profile yet.",
        "moodLine": "{mood} · {musicType}",
        "tracks": "{count} tracks"
      },
      "seo": {
        "title": "SEO",
        "description": "Titles, hashtags and keywords.",
        "empty": "No SEO profile yet."
      },
      "media": {
        "title": "Media",
        "description": "Images, video and documents attached to the project.",
        "emptyTitle": "No media yet",
        "emptyDescription": "Uploads need a storage provider, which is not configured yet."
      },
      "accessDenied": "You do not have access to this project's media."
    },
    "members": {
      "validationEmail": "Enter a valid email address",
      "linkCopied": "Invite link copied.",
      "linkCopyFailed": "Could not copy automatically. Select the link and copy it manually.",
      "loading": "Loading members…",
      "loadErrorTitle": "Could not load members",
      "loadErrorFallback": "Try again in a moment.",
      "retry": "Retry",
      "title": "Members",
      "listAria": "Project members",
      "collaborators": "{used} of {limit, plural, one {# collaborator} other {# collaborators}} invited on this project.",
      "deletedAccount": "Deleted account",
      "joined": "Joined {time}",
      "owner": "Project owner",
      "you": "(you)",
      "accountUnavailable": "Account no longer available",
      "ownerRemoveTooltip": "Only the project owner can remove members, and the owner cannot be removed.",
      "ownerRemoveAria": "Owner cannot be removed",
      "roleAria": "Role for {name}",
      "removeAria": "Remove {name}",
      "nonOwnerRemoveTooltip": "Only the project owner can remove members.",
      "nonOwnerRemoveAria": "Cannot remove {name}",
      "inviteTitle": "Invite a collaborator",
      "inviteDescription": "They get {email}added with the role you choose. Owner is never an option.",
      "limitTitle": "Member limit reached",
      "limitDescription": "This project can have {limit, plural, one {# collaborator} other {# collaborators}} on its current plan. {used} of {limit} collaborator slots are in use.",
      "limitCta": "Upgrade your plan",
      "onlyOwnerInvite": "Only the project owner can invite members.",
      "emailLabel": "Email address",
      "emailPlaceholder": "collaborator@example.com",
      "roleLabel": "Role",
      "inviteRoleAria": "Role for the invite",
      "createInvite": "Create invite",
      "inviteDisabledNote": "Invite controls are disabled because only the owner can manage members.",
      "pendingTitle": "Pending invites",
      "pendingDescription": "Expired invites refresh automatically every minute.",
      "invalidTitle": "Some invites are no longer valid",
      "invalidDescription": "Expired invites can still be revoked below; revoked and accepted invites are shown for reference.",
      "refresh": "Refresh",
      "pendingLoading": "Loading invites…",
      "pendingEmpty": "No pending invites.",
      "pendingAria": "Pending invites",
      "invitedByOwner": "invites by owner",
      "revoke": "Revoke",
      "removeTitle": "Remove this collaborator?",
      "removeDescription": "{name} immediately loses access to the project.",
      "removeUnknown": "This member",
      "keepMember": "Keep member",
      "removeMember": "Remove member",
      "inviteReadyTitle": "Invite ready for {email}",
      "inviteReadyDescription": "We also try to email this link. Email delivery may not be configured yet, so copy the link to be sure.",
      "inviteLinkAria": "Invite link",
      "copy": "Copy",
      "inviteExpiry": "Only you can see this link. It expires {expiry}.",
      "done": "Done",
      "inviteStates": {
        "pending": "pending",
        "accepted": "accepted",
        "revoked": "revoked",
        "expired": "expired"
      }
    },
    "activity": {
      "title": "Activity",
      "filterAria": "Filter activity by type",
      "loading": "Loading activity",
      "errorTitle": "Could not load activity",
      "errorFallback": "Try again in a moment.",
      "retry": "Retry",
      "emptyTitle": "No activity yet",
      "emptyDescription": "Invites, member changes and generations will appear here as your team works.",
      "filteredTitle": "No activity matches this filter",
      "filteredDescription": "Try a different activity type, or show everything.",
      "showAll": "Show all activity",
      "listAria": "Project activity",
      "someone": "Someone",
      "asRole": " as {role}",
      "pageOf": "Page {page} of {total} · {count} events",
      "previous": "Previous",
      "next": "Next",
      "types": {
        "memberAdded": "added a member",
        "memberRemoved": "removed a member",
        "roleChanged": "changed a role",
        "inviteCreated": "invited someone",
        "inviteAccepted": "accepted an invite",
        "inviteRevoked": "revoked an invite",
        "scriptGenerated": "generated a script",
        "thumbnailGenerated": "generated a thumbnail",
        "audioGenerated": "generated audio"
      },
      "filters": {
        "all": "All activity",
        "memberAdded": "Members added",
        "memberRemoved": "Members removed",
        "roleChanged": "Role changes",
        "inviteCreated": "Invites sent",
        "inviteAccepted": "Invites accepted",
        "inviteRevoked": "Invites revoked",
        "scriptGenerated": "Scripts",
        "thumbnailGenerated": "Thumbnails",
        "audioGenerated": "Audio"
      }
    },
    "export": {
      "aria": "Export project",
      "scopeAria": "Export scope",
      "preparing": "Preparing…",
      "preparingStatus": "Preparing export…",
      "export": "Export",
      "costPending": " · cost pending",
      "creditCost": " · {count} credits",
      "allowanceLeft": " · {remaining} of {limit} {limit, plural, one {free export} other {free exports}} left",
      "history": "Export history",
      "historyCredits": "{count} credits",
      "filenameFallback": "project",
      "blockedAllowance": "You have used your {limit} {limit, plural, one {free export} other {free exports}} for this project.",
      "blockedPricing": "Paid exports open once the export price is published. Your free export is unaffected.",
      "blockedNothing": "There is nothing to export yet — generate a script or some assets first.",
      "statusCompleted": "Completed",
      "statusFailed": "Failed",
      "statusInProgress": "In progress",
      "failureCancelled": "Cancelled — nothing was charged.",
      "failureAllowance": "Refused — the free export was already used.",
      "failureNone": "Nothing was charged.",
      "toastDownloaded": "Export downloaded",
      "toastFailed": "Export failed. Check that assets exist and retry.",
      "toastAllowance": "You have used your free export for this project.",
      "toastPricing": "Paid exports open once the export price is published.",
      "toastNothing": "There is nothing to export yet.",
      "scopes": {
        "full": "Complete (all)",
        "script": "Script",
        "images": "Images",
        "audio": "Audio",
        "media": "Media + script"
      }
    },
    "collab": {
      "roleChanged": "Role changed to {role}.",
      "roleFailed": "Failed to change role.",
      "memberRemoved": "Member removed from the project.",
      "memberRemoveFailed": "Failed to remove member.",
      "inviteCreated": "Invite created. Share the link below.",
      "inviteFailed": "Failed to create invite.",
      "inviteRevoked": "Invite revoked.",
      "inviteRevokeFailed": "Failed to revoke invite."
    },
    "expiry": {
      "expired": "expired",
      "days": "expires in {days} days",
      "hours": "expires in {hours, plural, one {# hour} other {# hours}}",
      "minutes": "expires in {minutes, plural, one {# minute} other {# minutes}}"
    },
    "generation": {
      "remaining": "{remaining} {noun} left this month",
      "unlimited": "{feature} is unlimited",
      "credits": "{balance} credits",
      "nouns": {
        "generation": "generation"
      }
    },
    "time": {
      "unknownDate": "Unknown date",
      "unknownTime": "Unknown time"
    },
    "media": {
      "loading": "Loading media",
      "playbackAria": "{title} playback"
    }
  };

/** The scalar stage strings are pinned here because the coroutines are functions. */
const FLOOR_STAGES = {
    "labels": {
      "creation": "Project",
      "configuration": "Configuration",
      "script": "Script",
      "script-edit": "Script edit",
      "thumbnail": "Thumbnail",
      "scene-images": "Scene images",
      "narration": "Narration",
      "sfx": "Sound effects",
      "preview": "Preview",
      "export": "Export"
    },
    "creationEmpty": "No project loaded",
    "configurationEmpty": "Not configured",
    "scriptEmpty": "No script yet",
    "scriptEditBlocked": "Generate the script first",
    "scriptEditEmpty": "No script to edit",
    "thumbnailReady": "Thumbnail ready",
    "thumbnailEmpty": "No thumbnail yet",
    "narrationReady": "Narration ready",
    "narrationEmpty": "No narration yet",
    "sfxEmpty": "No sound effects yet",
    "previewBlocked": "Finish the asset stages to preview the whole project",
    "previewReady": "Everything is in place",
    "previewPartial": "Shows what exists so far",
    "exportBlocked": "Generate a script to export",
    "exportReady": "Exported at least once",
    "exportEmpty": "Not exported yet"
  };

function leaves(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        out[prefix] = String(value);
        return out;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        Object.assign(out, leaves(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

/** Two or more Latin words of three letters or more, separated by a space. */
const PROSE = /[A-Za-z]{3,}(?:[ ][A-Za-z]{3,})+/;

/** String literals left in a `.ts` seam after comments and imports are stripped. */
function stringLiterals(file: string): string[] {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .split('\n')
        .filter((line) => !/^\s*import\b/.test(line))
        .join('\n');
    return [...source.matchAll(/(['"\`])([^'"\`\n]{6,})\1/g)].map((match) => match[2]);
}

describe('AR-031 workspace copy', () => {
    it('the .tsx surface has no English left in the source', () => {
        for (const file of SURFACE) {
            expect(hardcodedCopy(file), file).toEqual([]);
        }
    });

    it('the .ts seams carry no stray English literals', () => {
        for (const file of TS_SEAMS) {
            const prose = stringLiterals(file).filter(
                (text) => PROSE.test(text) && text !== 'use client'
            );
            expect(prose, file).toEqual([]);
        }
    });

    it('the English catalog is verbatim the pre-extraction copy', () => {
        expect(enWorkspace).toEqual(FLOOR);
    });

    it('the pure stage floor matches the catalog and has no duplicate literals', () => {
        for (const [key, value] of Object.entries(FLOOR_STAGES)) {
            if (typeof value === 'string') {
                expect(EN_STAGE_MESSAGES[key as keyof typeof EN_STAGE_MESSAGES]).toBe(value);
            }
        }
        expect(EN_STAGE_MESSAGES.labels).toEqual(FLOOR_STAGES.labels);
        expect(WORKFLOW_STAGES.map((stage) => stage.label)).toEqual(
            Object.values(EN_STAGE_MESSAGES.labels)
        );
    });

    it('every English key is translated, and nothing is a copy of English', () => {
        const en = leaves(enWorkspace);
        const ar = leaves(arWorkspace);
        expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
        for (const [key, value] of Object.entries(en)) {
            expect(ar[key]?.trim(), `${key} is empty in Arabic`).toBeTruthy();
            if (/^[A-Za-z0-9 .,:\-–—…()'"]+$/.test(value)) {
                expect(ar[key], `${key} is still English`).not.toBe(value);
            }
        }
    });

    it('placeholders survive and the Arabic keeps Latin digits', () => {
        const args = (message: string) =>
            [
                ...new Set(
                    [...message.matchAll(/\{([A-Za-z_][\w]*)\s*[},]/g)].map((match) => match[1])
                ),
            ].sort();
        const ar = leaves(arWorkspace);
        for (const [key, value] of Object.entries(leaves(enWorkspace))) {
            expect(args(ar[key]!), `${key} placeholders`).toEqual(args(value));
        }
        for (const [key, value] of Object.entries(leaves(arWorkspace))) {
            expect(value, `${key} uses a bare #`).not.toMatch(/(^|[^{])#/);
        }
    });
});
