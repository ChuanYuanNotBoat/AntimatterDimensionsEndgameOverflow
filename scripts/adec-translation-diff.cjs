'use strict';
// Offline translation review only. No source migration or catalog writes.
const fs = require('node:fs');
const crypto = require('node:crypto');
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const sourceId = pair => digest(`${pair.en}\0${pair.zh}`).slice(0, 16);
function groupPairs(pairs) {
  const groups = new Map();
  for (const pair of pairs) {
    const id = sourceId(pair);
    const entry = groups.get(id) ?? { id, en: pair.en, zh: pair.zh, references: [] };
    const reference = Object.fromEntries(['file', 'location', 'kind', 'scope', 'scopes', 'protectedParameters']
      .filter(key => pair[key] !== undefined).map(key => [key, pair[key]]));
    if (!entry.references.some(value => JSON.stringify(value) === JSON.stringify(reference))) entry.references.push(reference);
    groups.set(id, entry);
  }
  return groups;
}
function buildDiff(baseline, latest) {
  const old = groupPairs(baseline.pairs), current = groupPairs(latest.pairs);
  const changed = [...current.values()].filter(entry => !old.has(entry.id)).map(entry => ({ ...entry,
    change: [...old.values()].some(value => value.en === entry.en) ? 'revised' : 'added',
    previous: [...old.values()].filter(value => value.en === entry.en).map(value => value.id),
    status: 'needs-context-and-parameter-review' }));
  const removed = [...old.values()].filter(entry => !current.has(entry.id)).map(({ id, references }) => ({ id, references,
    status: 'retain-current-translation-until-reviewed' }));
  return { version: 1, repository: latest.repository, baseline: baseline.revision, latest: latest.revision,
    sourceRevision: latest.sourceRevision, counts: { added: changed.filter(entry => entry.change === 'added').length,
      revised: changed.filter(entry => entry.change === 'revised').length, removedOrRevised: removed.length },
    entries: changed, removed, unmatched: latest.unmatched };
}
if (require.main === module) {
  const [before, after, output] = process.argv.slice(2);
  if (!before || !after || !output) throw new Error('Usage: adec-translation-diff.cjs baseline-report latest-report review-output');
  const report = buildDiff(JSON.parse(fs.readFileSync(before)), JSON.parse(fs.readFileSync(after)));
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ baseline: report.baseline, latest: report.latest, ...report.counts }));
}
module.exports = { buildDiff, groupPairs, digest, sourceId };
