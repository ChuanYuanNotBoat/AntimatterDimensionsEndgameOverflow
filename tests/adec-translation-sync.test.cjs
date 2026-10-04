'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { buildDiff } = require('../scripts/adec-translation-diff.cjs');
const root = path.resolve(__dirname, '..');
test('translation-only extraction uses confirmation option IDs and rejects shifted positional prose', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'adec-source-review-'));
  try {
    const before = path.join(directory, 'en'), after = path.join(directory, 'reference');
    for (const dir of [before, after]) {
      fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
      execFileSync('git', ['init', '-q', dir]);
      execFileSync('git', ['-C', dir, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture']);
    }
    fs.writeFileSync(path.join(before, 'src/options.js'), `export const options = [
      { option: 'overcharge', name: 'Overcharge' }, { option: 'reset', name: 'Reset Reality' }];
      export const prose = ['Before', 'After'];`);
    fs.writeFileSync(path.join(after, 'src/options.js'), `export const options = [
      { option: 'compression', name: '时间压缩' }, { option: 'overcharge', name: '激能' }, { option: 'reset', name: '重置现实' }];
      export const prose = ['新增', '之前', '之后'];`);
    const output = path.join(directory, 'review.json');
    const catalog = fs.readFileSync(path.join(root, 'src/locales/zh-CN.json'));
    execFileSync(process.execPath, [path.join(root, 'scripts/sync-adechinese.cjs'), after, '--source', before, '--report-only', output], { cwd: root });
    const report = JSON.parse(fs.readFileSync(output));
    assert.ok(report.pairs.some(pair => pair.en === 'Overcharge' && pair.zh === '激能'));
    assert.ok(report.pairs.some(pair => pair.en === 'Reset Reality' && pair.zh === '重置现实'));
    assert.ok(!report.pairs.some(pair => pair.zh === '时间压缩'));
    assert.ok(!report.pairs.some(pair => pair.en === 'Before' || pair.en === 'After'));
    assert.ok(report.unmatched.some(entry => entry.reason === 'positional-array-layout-differs'));
    assert.deepEqual(fs.readFileSync(path.join(root, 'src/locales/zh-CN.json')), catalog);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('translation diff deduplicates occurrences, exposes revisions/removals and never applies them', () => {
  const pair = { en: 'A resource', zh: '资源', file: 'src/example.js', location: 'id:1', kind: 'script-text' };
  const before = { revision: 'before', pairs: [pair] };
  const after = { revision: 'after', repository: 'reference', pairs: [{ ...pair, zh: '新资源' }, { ...pair, zh: '新资源' }], unmatched: [] };
  const report = buildDiff(before, after);
  assert.equal(report.entries.length, 1);
  assert.equal(report.counts.revised, 1);
  assert.equal(report.removed[0].status, 'retain-current-translation-until-reviewed');
  assert.equal(before.pairs[0].zh, '资源');
});
