<?php
/**
 * Render the real mobile journal dock snippet from header.tpl with Smarty (no database).
 * Usage: php tools/qa/journal-dock-markup.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$source = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/components/header.tpl');
if (!preg_match('~<nav class="pim-mobile-tools-bar[^"]*".*?</nav>~s', $source, $snippet)) {
    fwrite(STDERR, "FAIL: <nav class=\"pim-mobile-tools-bar\"> dock not found in header.tpl\n");
    exit(1);
}
$compileDir = sys_get_temp_dir() . '/pim-theme-qa';
if (!is_dir($compileDir)) {
    mkdir($compileDir, 0700, true);
}
$smarty = new Smarty();
$smarty->setCompileDir($compileDir);
$smarty->registerPlugin('function', 'url', static fn($p) => '/mbj/' . $p['page'] . (isset($p['op']) ? '/' . $p['op'] : ''));
$html = $smarty->fetch('string:' . $snippet[0]);

$dom = new DOMDocument();
@$dom->loadHTML('<?xml encoding="utf-8"?>' . $html);
$xpath = new DOMXPath($dom);
$fail = static function (string $m) use ($html) { fwrite(STDERR, "FAIL: {$m}\n{$html}\n"); exit(1); };
$nav = $xpath->query('//nav')->item(0);
if ($nav->getAttribute('aria-label') !== 'Journal tools') $fail('dock nav must be labelled "Journal tools"');
$items = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " pim-dock-item ")]');
$labels = [];
foreach ($items as $item) {
    $labels[] = trim($xpath->query('.//span', $item)->item(0)->textContent ?? '');
    if (!$xpath->query('.//i[@aria-hidden="true"]', $item)->length) $fail('every dock item needs an aria-hidden icon');
}
if ($labels !== ['Menu', 'Information', 'Search', 'Submit']) $fail('dock labels must be Menu, Information, Search, Submit; got ' . implode(',', $labels));
$menu = $items->item(0);
$info = $items->item(1);
if ($menu->nodeName !== 'button' || $menu->getAttribute('data-pim-tools-tab') !== 'menu' || $menu->getAttribute('aria-controls') !== 'pimJournalMenuPanel' || $menu->getAttribute('aria-expanded') !== 'false') $fail('Menu must be a button controlling pimJournalMenuPanel');
if ($info->nodeName !== 'button' || $info->getAttribute('data-pim-tools-tab') !== 'links' || $info->getAttribute('aria-controls') !== 'pimJournalLinksPanel' || $info->getAttribute('aria-expanded') !== 'false') $fail('Information must be a button controlling pimJournalLinksPanel');
if ($items->item(2)->getAttribute('href') !== '/mbj/search') $fail('Search must link to the journal search');
if ($items->item(3)->getAttribute('href') !== '/mbj/about/submissions') $fail('Submit must link to about/submissions');
if (str_contains($html, 'pimMobileToolsToggle') || str_contains($html, 'role="tab"') || str_contains($html, 'role="tablist"')) $fail('the old toggle and tab roles must be gone');
echo "PASS: Journal dock renders Menu, Information, Search and Submit with correct controls and links.\n";
