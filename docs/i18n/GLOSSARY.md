# C0C glossary — the locked product vocabulary (EN ↔ AR)

| | |
|---|---|
| **Status** | AR-015 — the starter glossary |
| **Scope** | The terms the product repeats across namespaces. A term listed here is translated ONE way, everywhere. |
| **Rule** | A new term joins this file in the same PR that introduces it — never in a follow-up "translation fix" PR. |

## 1. Why a glossary exists

Two namespaces must not translate the same word two ways: the dashboard's
"members" and the team's "members" are the same people, and the billing
ledger's "held" and the credits panel's "held" are the same state. Without a
locked vocabulary the Arabic UI would read like two products stitched
together — and a reviewer would have to arbitrate every single string.

## 2. The vocabulary

| English | Arabic | Notes |
|---|---|---|
| Project | مشروع | the unit of work; never "خطة" (that is "plan") |
| Projects | مشاريع | |
| Dashboard | لوحة التحكم | the app's home, not "لوحة 信息" |
| Workspace | مساحة العمل | the project-scoped workspace |
| Script | نص (سكريبت) | the generated video script; "نص" alone means "text" |
| Scene | مشهد | one section of a script |
| Title | عنوان | a video title; not "عنوان الصفحة" |
| Hashtag | وسم | rendered with the leading `#` as today |
| Thumbnail | صورة مصغّرة | |
| Audio | صوت | |
| Media | وسائط | the media library |
| Trend / Trending | اتجاه / الاتجاهات الرائجة | the trends feed |
| Analytics | التحليلات | the analytics dashboard |
| Planner | المُخطِّط | the content planner |
| Credits | أرصدة | the credit balance; never "دولارات" |
| Credit (unit) | رصيد | singular; the plural is the same form with the count |
| Generation | توليد | one AI generation |
| Generation limit | حد التوليدات | |
| Quota | الحصة | the enforced allowance |
| Plan | خطة | Starter / Pro / Studio |
| Subscription | اشتراك | |
| Billing | الفوترة | |
| Invoice | فاتورة | |
| Refund | استرداد | a returned amount |
| Grant (credits) | إضافة | the verb that ADDS credits |
| Hold (credits) | حجز | credits reserved for a pending generation |
| Settle (credits) | تسوية | a hold that became a real generation |
| Release (credits) | تحرير | a hold that was given back |
| Balance | الرصيد | |
| Owner | مالك | a project role |
| Admin | مسؤول | a project role; not "admin" in Latin |
| Editor | محرّر | a project role |
| Viewer | مشاهد | a project role |
| Member | عضو | |
| Invite | دعوة | the verb and the noun |
| Team | فريق | |
| Settings | الإعدادات | |
| Appearance | المظهر | the settings tab |
| API keys | مفاتيح API | "API" stays Latin (a brand-ish term) |
| Theme | المظهر | the light/dark/system toggle |
| Upgrade | ترقية | the plan upgrade action |
| Free | مجاني | the zero-price plan label |
| Starter | انطلاق | the free plan's label; the ID stays \`starter\` |
| Pro | احترافي | the ID stays \`pro\` |
| Studio | استوديو | the ID stays \`studio\` |

## 3. Do not translate

| Content | Rule | Why |
|---|---|---|
| Brand: C0C, AI Content Engine | keep Latin | the brand is the brand in every market |
| Platform names: YouTube, TikTok, Instagram, Facebook | keep Latin | they are proper nouns the users type |
| Plan IDs: \`starter\`, \`pro\`, \`studio\` | keep Latin | they are data keys, and they travel in URLs and the API |
| Error codes, HTTP codes | keep Latin | machine strings |
| IDs, tokens, URLs, emails | keep Latin, and render them LTR | they are not words |
| Units: B, KB, MB, GB, USD | keep Latin | technical shorthand |
| Code and JSON blocks | keep Latin, LTR | they are code |

## 4. Numbers and punctuation

- **Digits are Latin everywhere** (AR-D-04): `1,234` in Arabic as well as in
  English. The credit ledger must stay copy-pasteable and comparable with the
  Stripe dashboard.
- **Arabic punctuation**: `،` (comma) `؛` (semicolon) `؟` (question mark).
  A catalog value in Arabic must not carry a Latin `,` `;` `?` — the CI gate
  checks it (`tests/i18n/common-namespace.test.ts`).
- **No bidi control characters** in catalog values. The renderer isolates the
  user content, not the copy.

## 5. Namespace ownership

| Namespace | Owner area | The surfaces it speaks for |
|---|---|---|
| \`common\` | App shell / design-system owner | the shared vocabulary: buttons, states, a11y labels |
| \`navigation\` | App shell | the sidebar, the ⌘K palette, the breadcrumbs, the footer |
| \`dataState\` | App shell | loading / empty / error / success primitives |
| \`landing\` | Marketing | the landing page |
| \`pricing\` | Marketing | the pricing page and the plan chooser copy |
| \`legal\` | Marketing | privacy, terms |
| \`auth\` | Account flows | login, signup, recovery, verification, the auth banners |
| \`dashboard\` | Insights | the dashboard widgets |
| \`analytics\` | Insights | the analytics dashboard and the charts |
| \`planner\` | Insights | the content planner and the calendar |
| \`trends\` | Insights | the trends feed and its provenance labels |
| \`seo\` | Insights | the SEO analyzer |
| \`projects\` | Project & workspace | the projects list, the toolbar, the wizard, the invite |
| \`workspace\` | Project & workspace | the workspace shell, its tabs, the members, the activity, the export |
| \`scripts\` | Project & workspace | the script generator and the scene editor |
| \`titles\`, \`hashtags\`, \`audio\`, \`thumbnails\` | Project & workspace | the generators that mount in the workspace |
| \`media\` | Project & workspace | the media library and the media workspace |
| \`billing\` | Account ops | the plan chooser, the credits ledger, the billing settings |
| \`notifications\` | Account ops | the bell and the notification templates |
| \`team\` | Account ops | the team management and the roles |
| \`onboarding\` | Account ops | the wizard, the step panels, the option vocabulary |
| \`settings\` | Account flows | the account settings |
| \`errors\` | Platform (single owner) | the error-code → message map, consumed everywhere |

**One owner per namespace**: a key is added in the same PR as the component
that consumes it, and the owner reviews every Arabic delta in that
namespace.
