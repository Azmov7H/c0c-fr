#!/usr/bin/env node
/**
 * Publishes a Trivy JSON report as GitHub error annotations.
 *
 * Why this exists: the image scan is the last line of defence for the
 * production image, and a finding nobody can see is a finding nobody fixes.
 * The scan's table output lives in a CI log; annotations live with the check
 * run — they show up in the PR "Files changed"/"Checks" view, next to the
 * commit that introduced the vulnerable layer.
 *
 * Usage: node scripts/publish-trivy-annotations.mjs <report.json>
 * Exit:  0 always (the gate is the scan step's exit code; this step only
 *        reports). Prints one `::error` workflow command per finding.
 */
import { readFileSync } from 'node:fs';

const reportPath = process.argv[2];
if (!reportPath) {
    console.error('usage: publish-trivy-annotations.mjs <report.json>');
    process.exit(0);
}

let report;
try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
    console.error(`could not read the Trivy report: ${error.message}`);
    process.exit(0);
}

const results = Array.isArray(report?.Results) ? report.Results : [];
let count = 0;

for (const result of results) {
    for (const vuln of result?.Vulnerabilities ?? []) {
        count += 1;
        const fixed = vuln.FixedVersion ? ` — fixed in ${vuln.FixedVersion}` : '';
        const severity = vuln.Severity ?? 'UNKNOWN';
        // The message is deliberately one line: a GitHub workflow command ends
        // at the newline, so a multi-line message would be truncated.
        const message = `${vuln.PkgName} ${vuln.InstalledVersion ?? ''}${fixed}`.trim();
        console.log(
            `::error file=trivy,title=${vuln.VulnerabilityID} (${severity})::${message}`
        );
    }
}

if (count === 0) {
    console.log('no HIGH/CRITICAL findings to report');
} else {
    console.log(`${count} finding(s) reported as annotations`);
}
