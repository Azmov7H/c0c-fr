/**
 * AR-021 — the QA gallery's sample content.
 *
 * The gallery is a REVIEW artifact, not a product surface: it shows the
 * primitives with representative copy in both directions, so a conversion
 * can be checked by eye before it ships.
 *
 * Its strings are deliberately NOT taken from the catalogs:
 *
 *   - the catalogs are English placeholders until the AR-022…AR-035
 *     extraction batches land, so a gallery wired to them would show English
 *     in the Arabic pane and hide the very thing the gallery exists to show;
 *   - the gallery introduces no product copy, so it belongs to no namespace
 *     and stays out of the catalog gates (parity, usage) entirely.
 *
 * What the strings have to be is REPRESENTATIVE: the same shapes, roughly
 * the same lengths, in the language of the pane. A layout that survives
 * English and breaks on Arabic is usually a layout that was measured against
 * one very specific string.
 */

export interface QaSampleText {
    /** The pane's own title (the direction it renders in). */
    paneTitle: string;
    paneNote: string;

    pageTitle: string;
    pageNote: string;

    buttons: {
        primary: string;
        secondary: string;
        outline: string;
        ghost: string;
        destructive: string;
        withIcon: string;
    };

    icons: {
        title: string;
        note: string;
        mirroredLabel: string;
        neverMirroredLabel: string;
        mirroredNames: string[];
        neverMirroredNames: string[];
    };

    form: {
        label: string;
        placeholder: string;
        helper: string;
        checkbox: string;
        radioLegend: string;
        radioOptions: string[];
        selectLabel: string;
        selectOptions: string[];
        textareaLabel: string;
        textareaPlaceholder: string;
    };

    card: {
        title: string;
        description: string;
        action: string;
        footer: string;
    };

    table: {
        caption: string;
        headers: string[];
        rows: string[][];
    };

    pagination: {
        previous: string;
        next: string;
        page: string;
        /** The landmark label — it must be UNIQUE per pane (two panes, one document). */
        navLabel: string;
    };

    tabs: {
        labels: string[];
    };

    accordion: {
        items: { question: string; answer: string }[];
    };

    breadcrumb: {
        items: string[];
        /** The landmark label — it must be UNIQUE per pane (two panes, one document). */
        navLabel: string;
    };

    alert: {
        title: string;
        description: string;
    };

    badges: string[];

    empty: {
        title: string;
        description: string;
        action: string;
    };

    tooltip: {
        trigger: string;
        content: string;
    };

    dropdown: {
        trigger: string;
        items: string[];
    };

    dialog: {
        trigger: string;
        title: string;
        description: string;
        confirm: string;
        cancel: string;
    };

    sheet: {
        trigger: string;
        startTrigger: string;
        endTrigger: string;
        title: string;
        description: string;
    };

    progress: {
        label: string;
        value: number;
    };

    avatar: {
        initials: string;
        name: string;
    };

    stats: { label: string; value: string; change: string }[];

    skeleton: {
        label: string;
    };

    separator: {
        label: string;
    };
}

export const RTL_QA_SAMPLES: Record<'en' | 'ar', QaSampleText> = {
    en: {
        paneTitle: 'English · LTR',
        paneNote: 'The reference pane. Every layout below must match it.',
        pageTitle: 'RTL QA gallery',
        pageNote:
            'A review artifact, not a product page: every primitive, in both directions, side by side.',
        buttons: {
            primary: 'Save changes',
            secondary: 'Duplicate',
            outline: 'Preview',
            ghost: 'Cancel',
            destructive: 'Delete project',
            withIcon: 'Create project',
        },
        icons: {
            title: 'Icon direction',
            note: 'Directional glyphs mirror; semantic ones never do.',
            mirroredLabel: 'Mirrors in RTL',
            neverMirroredLabel: 'Never mirrors',
            mirroredNames: ['ArrowLeft', 'ChevronRight', 'Undo2', 'PanelLeft'],
            neverMirroredNames: ['Play', 'Check', 'X', 'Search', 'Upload'],
        },
        form: {
            label: 'Email address',
            placeholder: 'you@company.com',
            helper: 'We only use this to send the project invite.',
            checkbox: 'Remember me on this device',
            radioLegend: 'Who can see this project',
            radioOptions: ['Only me', 'My team', 'Anyone with the link'],
            selectLabel: 'Default language',
            selectOptions: ['English', 'Arabic'],
            textareaLabel: 'Project brief',
            textareaPlaceholder: 'What is this project about?',
        },
        card: {
            title: 'Storage used',
            description: 'Your workspace is using 12.4 GB of the 20 GB included in the plan.',
            action: 'Manage',
            footer: 'The next billing cycle starts on 1 March.',
        },
        table: {
            caption: 'Recent projects',
            headers: ['Project', 'Owner', 'Updated', 'Size'],
            rows: [
                ['Launch campaign', 'Dana Reeves', '12 Nov 2025', '1.2 GB'],
                ['Arabic landing page', 'Omar Haddad', '11 Nov 2025', '840 MB'],
                ['Podcast series', 'Ines Costa', '09 Nov 2025', '3.1 GB'],
            ],
        },
        pagination: {
            previous: 'Previous',
            next: 'Next',
            page: 'Page 2 of 7',
            navLabel: 'Pagination (English)',
        },
        tabs: {
            labels: ['Overview', 'Activity', 'Members', 'Settings'],
        },
        accordion: {
            items: [
                {
                    question: 'Is the project content translated automatically?',
                    answer: 'Yes — every script is generated in the language you choose, with the glossary applied.',
                },
                {
                    question: 'Can I invite a reviewer who does not have an account?',
                    answer: 'You can send an invite link. The reviewer gets a read-only view of the workspace.',
                },
            ],
        },
        breadcrumb: {
            items: ['Projects', 'Launch campaign', 'Scripts'],
            navLabel: 'Breadcrumb (English)',
        },
        alert: {
            title: 'Your trial ends in 3 days',
            description: 'Add a card to keep your workspaces and your generated scripts.',
        },
        badges: ['Active', 'Draft', 'Failed', 'Archived'],
        empty: {
            title: 'No projects yet',
            description: 'Create your first project to start generating scripts and titles.',
            action: 'Create project',
        },
        tooltip: {
            trigger: 'Copy the share link',
            content: 'The link expires after 7 days.',
        },
        dropdown: {
            trigger: 'Open menu',
            items: ['Rename', 'Duplicate', 'Move to folder', 'Archive', 'Delete'],
        },
        dialog: {
            trigger: 'Delete project',
            title: 'Delete “Launch campaign”?',
            description: 'The scripts, the titles and the thumbnails are deleted with it. This cannot be undone.',
            confirm: 'Delete',
            cancel: 'Keep it',
        },
        sheet: {
            trigger: 'Open the filters',
            startTrigger: 'Open from the start edge',
            endTrigger: 'Open from the end edge',
            title: 'Filters',
            description: 'Narrow the list by owner, language and status.',
        },
        progress: {
            label: 'Generating the script',
            value: 62,
        },
        avatar: {
            initials: 'AR',
            name: 'Aisha Rahman',
        },
        stats: [
            { label: 'Projects', value: '12', change: '+2 this week' },
            { label: 'Generated scripts', value: '348', change: '+41 this week' },
            { label: 'Credits left', value: '320', change: 'of 500' },
        ],
        skeleton: {
            label: 'Loading skeleton',
        },
        separator: {
            label: 'Separator',
        },
    },
    ar: {
        paneTitle: 'العربية · من اليمين إلى اليسار',
        paneNote: 'لوحة المرجع. يجب أن يطابق كل تخطيط هنا اللوحة الإنجليزية.',
        pageTitle: 'صفحة مراجعة الاتجاه',
        pageNote:
            'أداة مراجعة داخلية لا صفحة منتج: كل عنصر أساسي، في الاتجاهين، جنبًا إلى جنب.',
        buttons: {
            primary: 'حفظ التغييرات',
            secondary: 'نسخة مطابقة',
            outline: 'معاينة',
            ghost: 'إلغاء',
            destructive: 'حذف المشروع',
            withIcon: 'إنشاء مشروع',
        },
        icons: {
            title: 'اتجاه الأيقونات',
            note: 'الأيقونات الاتجاهية تنعكس، أما الدلالية فلا تنعكس أبدًا.',
            mirroredLabel: 'تنعكس في العربية',
            neverMirroredLabel: 'لا تنعكس أبدًا',
            mirroredNames: ['ArrowLeft', 'ChevronRight', 'Undo2', 'PanelLeft'],
            neverMirroredNames: ['Play', 'Check', 'X', 'Search', 'Upload'],
        },
        form: {
            label: 'البريد الإلكتروني',
            placeholder: 'you@company.com',
            helper: 'نستخدمه فقط لإرسال دعوة المشروع.',
            checkbox: 'تذكّرني على هذا الجهاز',
            radioLegend: 'من يمكنه رؤية هذا المشروع',
            radioOptions: ['أنا وحدي', 'فريقتي', 'أي شخص يملك الرابط'],
            selectLabel: 'اللغة الافتراضية',
            selectOptions: ['العربية', 'الإنجليزية'],
            textareaLabel: 'موجز المشروع',
            textareaPlaceholder: 'فيمَ يتحدث هذا المشروع؟',
        },
        card: {
            title: 'المساحة المستخدمة',
            description: 'تستخدم مساحة عملك 12.4 غيغابايت من أصل 20 غيغابايت المتضمنة في الخطة.',
            action: 'إدارة',
            footer: 'تبدأ دورة الفوترة التالية في 1 مارس.',
        },
        table: {
            caption: 'أحدث المشاريع',
            headers: ['المشروع', 'المالك', 'آخر تحديث', 'الحجم'],
            rows: [
                ['حملة الإطلاق', 'دينا ريفز', '12 نوفمبر 2025', '1.2 غ.ب'],
                ['الصفحة العربية', 'عمر حداد', '11 نوفمبر 2025', '840 م.ب'],
                ['سلسلة البودكاست', 'إينيز كوستا', '09 نوفمبر 2025', '3.1 غ.ب'],
            ],
        },
        pagination: {
            previous: 'السابق',
            next: 'التالي',
            page: 'الصفحة 2 من 7',
            navLabel: 'التنقل بين الصفحات (العربية)',
        },
        tabs: {
            labels: ['نظرة عامة', 'النشاط', 'الأعضاء', 'الإعدادات'],
        },
        accordion: {
            items: [
                {
                    question: 'هل يُترجَم محتوى المشروع تلقائيًا؟',
                    answer: 'نعم، كل نص يُولَّد باللغة التي تختارها مع تطبيق قاموس المصطلحات.',
                },
                {
                    question: 'هل يمكنني دعوة مراجع ليس لديه حساب؟',
                    answer: 'يمكنك إرسال رابط دعوة، ويحصل المراجع على عرض للقراءة فقط.',
                },
            ],
        },
        breadcrumb: {
            items: ['المشاريع', 'حملة الإطلاق', 'النصوص'],
            navLabel: 'مسار التنقل (العربية)',
        },
        alert: {
            title: 'تنتهي فترتك التجريبية بعد 3 أيام',
            description: 'أضف بطاقة للاحتفاظ بمساحات عملك والنصوص التي ولّدتها.',
        },
        badges: ['نشط', 'مسودة', 'فشل', 'مؤرشف'],
        empty: {
            title: 'لا توجد مشاريع بعد',
            description: 'أنشئ مشروعك الأول لتبدأ في توليد النصوص والعناوين.',
            action: 'إنشاء مشروع',
        },
        tooltip: {
            trigger: 'انسخ رابط المشاركة',
            content: 'ينتهي صلاحية الرابط بعد 7 أيام.',
        },
        dropdown: {
            trigger: 'افتح القائمة',
            items: ['إعادة تسمية', 'نسخة مطابقة', 'نقل إلى مجلد', 'أرشفة', 'حذف'],
        },
        dialog: {
            trigger: 'حذف المشروع',
            title: 'هل تريد حذف «حملة الإطلاق»؟',
            description: 'تُحذف النصوص والعناوين والصور المصغّرة معه، ولا يمكن التراجع عن ذلك.',
            confirm: 'حذف',
            cancel: 'أبقِه',
        },
        sheet: {
            trigger: 'افتح عوامل التصفية',
            startTrigger: 'افتح من حافة البداية',
            endTrigger: 'افتح من حافة النهاية',
            title: 'عوامل التصفية',
            description: 'ضيّق القائمة حسب المالك واللغة والحالة.',
        },
        progress: {
            label: 'جارٍ توليد النص',
            value: 62,
        },
        avatar: {
            initials: 'ع ر',
            name: 'عائشة رحمن',
        },
        stats: [
            { label: 'المشاريع', value: '12', change: '+2 هذا الأسبوع' },
            { label: 'النصوص المولَّدة', value: '348', change: '+41 هذا الأسبوع' },
            { label: 'الأرصدة المتبقية', value: '320', change: 'من 500' },
        ],
        skeleton: {
            label: 'هيكل التحميل',
        },
        separator: {
            label: 'فاصل',
        },
    },
};
