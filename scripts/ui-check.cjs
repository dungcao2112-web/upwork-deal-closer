const { chromium } = require('playwright');
// Usage: npm run dev  (in another terminal), then: node scripts/ui-check.cjs ./screenshots
const OUT = process.argv[2] || '.';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('dialog', (d) => d.accept());
  const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  // M1
  ok(await page.getByTestId('panel-analyzer').isVisible(), 'M1 panel visible');
  const wr = await page.getByTestId('win-rate-value').innerText();
  ok(/\d+%/.test(wr), 'win-rate gauge shows ' + wr);
  ok((await page.getByTestId('score-dimensions').locator('> div').count()) === 5, '5 score dimensions');
  ok((await page.getByTestId('edge-cases').locator('> div').count()) >= 2, 'edge cases rendered');
  await page.screenshot({ path: OUT + '/1-analyzer.png', fullPage: true });

  // load job 7 (red flags)
  await page.getByTestId('sample-jobs').getByText('7. Reverse Engineer').click();
  const v7 = await page.getByTestId('verdict').innerText();
  ok(v7 !== 'MUST-BID', 'job 7 verdict not MUST-BID: ' + v7);
  ok((await page.getByTestId('red-flags').innerText()).includes('ngoài Upwork'), 'off-platform red flag shown');

  // paste custom JD -> live re-score
  await page.getByTestId('job-title').fill('WordPress plugin fix');
  await page.getByTestId('job-description').fill('Need a cheap WordPress and PHP developer for data entry. Quick and easy.');
  const wrCustom = parseInt(await page.getByTestId('win-rate-value').innerText());
  ok(wrCustom < 40, 'off-niche custom JD scores low: ' + wrCustom);

  // back to job 2
  await page.getByTestId('sample-jobs').getByText('2. Custom MCP Server').click();
  ok((await page.getByTestId('current-job-title').innerText()).includes('MCP'), 'header shows current job');

  // M2
  await page.getByTestId('nav-portfolio').click();
  ok((await page.getByTestId('project-ranking').locator('li').count()) === 7, '7 projects ranked');
  ok((await page.getByTestId('project-ranking').locator('li').first().innerText()).includes('CEO Multi-Agent'), 'top match for MCP job = CEO Multi-Agent');
  ok((await page.getByTestId('loom-script').locator('li').count()) >= 3, 'Loom script segments');
  await page.getByRole('button', { name: 'Copy kịch bản' }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok(clip.includes('90-SECOND LOOM SCRIPT'), 'Loom script copied to clipboard');
  await page.screenshot({ path: OUT + '/2-portfolio.png', fullPage: true });
  // manager: add project
  await page.getByTestId('portfolio-view').getByText('Quản lý Kho Dự Án').click();
  await page.getByTestId('add-project').click();
  await page.getByTestId('project-name').fill('Test Custom Project');
  await page.getByTestId('save-project').click();
  ok((await page.getByTestId('project-list').innerText()).includes('Test Custom Project'), 'custom project added to portfolio');
  await page.screenshot({ path: OUT + '/2b-manager.png', fullPage: false });

  // M3
  await page.getByTestId('nav-proposal').click();
  const t1 = await page.getByTestId('proposal-text').inputValue();
  ok(t1.length > 500 && !/^(Hi|Dear)/.test(t1), 'Angle 1 generated, no cliché opener');
  ok((await page.getByTestId('above-fold').innerText()).length > 50, 'above-the-fold preview');
  await page.getByTestId('tone-switch').getByText('Executive Consultant').click();
  const t1b = await page.getByTestId('proposal-text').inputValue();
  ok(t1b !== t1, 'tone switch changes proposal');
  await page.getByTestId('toggle-diagram').click();
  ok((await page.getByTestId('proposal-text').inputValue()).includes('Solution architecture'), 'diagram toggle inserts architecture');
  await page.getByTestId('angle-tabs').locator('button').nth(1).click();
  ok((await page.getByTestId('proposal-text').inputValue()).includes('1) '), 'Angle 2 shows numbered traps');
  await page.getByRole('button', { name: 'Copy Proposal' }).click();
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Dũng'), 'proposal copied');
  await page.screenshot({ path: OUT + '/3-proposal.png', fullPage: true });
  await page.getByTestId('proposal-mode').getByText('So sánh 3 bản').click();
  ok(await page.getByTestId('compare-view').isVisible(), 'compare 3 side-by-side');
  await page.screenshot({ path: OUT + '/3b-compare.png', fullPage: false });

  // M4
  await page.getByTestId('nav-bid').click();
  ok((await page.getByTestId('bid-tiers').locator('button').count()) === 3, '3 bid tiers');
  await page.getByTestId('tier-premium').click();
  ok((await page.getByTestId('tier-premium').innerText()).includes('Đang chọn'), 'select premium tier');
  await page.getByTestId('milestone-count').getByText('3 giai đoạn').click();
  ok((await page.getByTestId('milestones-table').locator('tbody tr').count()) === 3, '3 milestones table');
  await page.getByRole('button', { name: 'Copy trọn bộ Milestones' }).click();
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Milestone 3'), 'milestones copied');
  await page.screenshot({ path: OUT + '/4-bid.png', fullPage: true });

  // M5
  await page.getByTestId('nav-radar').click();
  await page.getByTestId('niche-cards').getByText('3D Web & Blender Automation').click();
  await page.getByTestId('plus-terms').getByText('react three fiber').click();
  const href = await page.getByTestId('open-upwork').getAttribute('href');
  ok(href.startsWith('https://www.upwork.com/nx/search/jobs/?q=') && new URL(href).searchParams.get('q').includes('"react three fiber"'), 'Upwork search URL built');
  await page.getByRole('button', { name: 'Copy Boolean' }).click();
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes('NOT wordpress'), 'boolean copied');
  ok((await page.getByTestId('profile-title').innerText()).length <= 70, 'profile title ≤70');
  await page.screenshot({ path: OUT + '/5-radar.png', fullPage: true });

  // M6 save to CRM
  await page.getByTestId('nav-analyzer').click();
  await page.getByTestId('sample-jobs').getByText('5. Channex').click();
  await page.getByTestId('save-to-crm').click();
  await page.getByTestId('nav-pipeline').click();
  const savedCol = await page.getByTestId('column-saved').innerText();
  ok(savedCol.includes('Hotel Channel Manager Channex'), 'saved job appears in Saved column');
  const sentBefore = await page.getByTestId('column-sent').locator('[data-testid=deal-card]').count();
  await page.getByTestId('column-saved').locator('[data-testid=deal-card]').first().getByTestId('move-next').click();
  const sentAfter = await page.getByTestId('column-sent').locator('[data-testid=deal-card]').count();
  ok(sentAfter === sentBefore + 1, 'move deal to Proposal Sent');
  const statsText = await page.getByTestId('crm-stats').innerText();
  ok(/reply rate/i.test(statsText) && /win rate/i.test(statsText), 'analytics cards');
  // drag & drop
  const card = page.getByTestId('column-sent').locator('[data-testid=deal-card]').first();
  await card.dragTo(page.getByTestId('column-interviewing'));
  ok((await page.getByTestId('column-interviewing').locator('[data-testid=deal-card]').count()) >= 2, 'drag & drop to Interviewing');
  // open modal & notes
  await page.getByTestId('column-won').locator('[data-testid=deal-card]').first().click();
  await page.getByTestId('deal-notes').fill('Ghi chú test');
  ok(await page.getByTestId('deal-modal').isVisible(), 'deal modal opens');
  await page.screenshot({ path: OUT + '/6b-modal.png' });
  await page.keyboard.press('Escape');
  ok((await page.getByTestId('deal-modal').count()) === 0, 'Esc closes modal');
  // export
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-json').click()]);
  ok(dl.suggestedFilename().endsWith('.json'), 'export JSON download');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
  const p2 = await dl2.path();
  const csv = require('fs').readFileSync(p2, 'utf8');
  ok(csv.split('\n').length >= 8, 'export CSV rows: ' + csv.split('\n').length);
  // import (re-import the CSV)
  await page.getByTestId('import-file').setInputFiles(p2);
  await page.waitForTimeout(300);
  ok((await page.getByTestId('toasts').innerText()).includes('Đã nhập'), 'import CSV toast');
  await page.screenshot({ path: OUT + '/6-pipeline.png', fullPage: true });

  // persistence after reload
  await page.reload({ waitUntil: 'networkidle' });
  ok((await page.getByTestId('column-interviewing').innerText()).length > 0, 'CRM persisted after reload');

  // global search
  await page.getByTestId('global-search').fill('comfy');
  await page.getByText('Job mẫu').first().click();
  ok((await page.getByTestId('current-job-title').innerText()).includes('ComfyUI'), 'global search loads job');

  // ── Dịch JD tiếng Việt ─────────────────────────────
  // Chromium in CI has no proxy config → serve the REAL Google response through Node's fetch.
  await page.route('https://translate.googleapis.com/**', async (route) => {
    const r = await fetch(route.request().url());
    await route.fulfill({ status: r.status, body: await r.text(), headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  });
  await page.getByTestId('nav-analyzer').click();
  await page.getByTestId('sample-jobs').getByText('1. Faceless TikTok').click();
  await page.getByTestId('goto-translate').click();
  ok((await page.getByTestId('brief-headline').innerText()).length > 20, 'offline VI brief headline');
  ok((await page.getByTestId('vi-brief').innerText()).includes('phí 10%'), 'VI brief has money section');
  await page.getByTestId('translation').waitFor({ timeout: 30000 });
  const titleVi = await page.getByTestId('title-vi').innerText();
  ok(titleVi.length > 10 && titleVi !== 'Build Automated Faceless TikTok/Reels Video Pipeline with Remotion & Whisper', 'title translated: ' + titleVi);
  const trText = await page.getByTestId('translation').innerText();
  ok(/pipeline/i.test(trText) && !/hình vịt|đường ống/.test(trText), 'glossary fixed jargon in real Google output');
  await page.getByTestId('toggle-bilingual').click();
  await page.getByRole('button', { name: 'Copy bản dịch' }).click();
  ok((await page.evaluate(() => navigator.clipboard.readText())).includes(titleVi), 'translation copied');
  await page.screenshot({ path: OUT + '/8-translate.png', fullPage: true });
  await page.getByTestId('toggle-bilingual').click();

  // ── Job Scanner ─────────────────────────────────────
  await page.getByTestId('nav-scanner').click();
  await page.getByTestId('scan-sample').click();
  const rows = page.getByTestId('scan-row');
  ok((await rows.count()) === 6, 'scanner parsed 6 sample jobs');
  const firstWin = parseInt(await rows.first().innerText());
  const lastWin = parseInt((await rows.last().innerText()).split('\n')[1]);
  ok((await rows.first().innerText()).includes('MUST-BID'), 'best job on top is MUST-BID');
  ok((await rows.last().innerText()).includes('SKIP'), 'worst job at bottom is SKIP');
  await page.getByTestId('scan-hide-skip').click();
  ok((await rows.count()) < 6, 'hide SKIP filter works (' + (await rows.count()) + ')');
  await page.getByTestId('scan-hide-skip').click();
  await rows.nth(1).getByTestId('scan-skip').click();
  ok((await rows.count()) === 5, 'skip removes a row');
  await rows.first().getByTestId('scan-save').click();
  ok((await rows.first().innerText()).includes('Đã có trong CRM'), 'saved job flagged as already in CRM');
  await page.screenshot({ path: OUT + '/9-scanner.png', fullPage: true });
  const scanTitle = (await rows.first().innerText()).split('\n').find((l) => l.length > 30);
  await rows.first().getByTestId('scan-analyze').click();
  ok(await page.getByTestId('panel-analyzer').isVisible(), 'analyze button opens Phân hệ 1');
  ok((await page.getByTestId('current-job-title').innerText()).length > 10, 'scanned job loaded: ' + (await page.getByTestId('current-job-title').innerText()));

  // mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 392, 'mobile no horizontal page scroll (scrollWidth ' + sw + ')');
  await m.screenshot({ path: OUT + '/7-mobile.png', fullPage: false });

  console.log('\nConsole errors/warnings:', errors.length ? errors : 'none');
  await browser.close();
})();
