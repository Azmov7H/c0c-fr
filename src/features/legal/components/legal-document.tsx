export interface LegalSection {
    /** The section's id — the code addresses it, the copy does not. */
    id: string;
    /** The section's heading. */
    heading: string;
    /** The section's body. */
    body: string;
}

interface LegalDocumentProps {
    /** The document's title. */
    title: string;
    /** The notice that says the document is a template. */
    notice: { title: string; body: string };
    /** The document's sections, in order. */
    sections: readonly LegalSection[];
    /** The closing line (the governing entity and the effective date). */
    governing: string;
}

/**
 * AR-024 — the legal document.
 *
 * A legal page has a fixed SHAPE (a title, the template notice, the
 * sections, the closing line) and a changing TEXT. The shape is code; the
 * text is the catalog. The component is deliberately free of any i18n call:
 * the pages read the catalog and hand the strings down, so the same markup
 * serves both languages and the copy has exactly one home.
 *
 * The notice's title is emphasised with `<strong>`, as the original pages
 * did — and the body follows it in the SAME text node (the space is part of
 * the string), so the rendered document is byte-for-byte what it was before
 * the extraction.
 */
export function LegalDocument({
    title,
    notice,
    sections,
    governing,
}: LegalDocumentProps) {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
                <strong>{notice.title}</strong>
                {` ${notice.body}`}
            </p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
                {sections.map((section) => (
                    <section key={section.id}>
                        <h2 className="text-lg font-semibold text-foreground">
                            {section.heading}
                        </h2>
                        <p className="mt-2">{section.body}</p>
                    </section>
                ))}
                <p className="text-xs">{governing}</p>
            </div>
        </div>
    );
}
