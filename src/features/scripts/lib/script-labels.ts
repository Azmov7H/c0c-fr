import type { useTranslations } from 'next-intl';

/**
 * AR-032 — the persisted script scene label map.
 *
 * Backend strategies (c0c-bake/script-strategies) persist English tokens such as
 * `Hook`, `Introduction`, `Main Content`, `Conclusion`, `CTA`,
 * `Main Message`, `Supporting Information`. These are stored data / prompt
 * contract tokens (FR-28), so the stored JSON is never rewritten. Only the
 * *rendered* label is localized here, via literal `t(...)` calls in a switch.
 * `extract-usage.mjs` cannot check dynamic keys, so every branch uses a literal.
 *
 * Unknown labels (including user-edited custom labels) fall through unchanged.
 */
export type ScriptScenesTranslator = ReturnType<typeof useTranslations<'scripts'>>;

export function scriptSceneLabel(t: ScriptScenesTranslator, label: string): string {
    switch (label) {
        case 'Hook':
            return t('sceneLabels.Hook');
        case 'Introduction':
            return t('sceneLabels.Introduction');
        case 'Main Content':
            return t('sceneLabels.MainContent');
        case 'Conclusion':
            return t('sceneLabels.Conclusion');
        case 'CTA':
            return t('sceneLabels.CTA');
        case 'Main Message':
            return t('sceneLabels.MainMessage');
        case 'Supporting Information':
            return t('sceneLabels.SupportingInformation');
        default:
            return label;
    }
}
