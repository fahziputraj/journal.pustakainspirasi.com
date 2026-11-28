<?php
/**
 * Portal footer links must not point at /index/about* (OJS redirects those to Login without a journal).
 * Usage: php tools/qa/portal-links.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$fail = function ($m) { fwrite(STDERR, "FAIL $m\n"); exit(1); };
$src = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl');
if (!preg_match('/\{\* pim-portal-links:start.*?\{\* pim-portal-links:end \*\}/s', $src, $m)) $fail('markers not found');
$render = function (bool $journal) use ($m) {
    $dir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    $s = new Smarty();
    $s->setCompileDir($dir);
    $s->registerPlugin('function', 'url', fn ($p) => '/' . ($GLOBALS['ctx'] ?? 'index') . '/' . ($p['page'] ?? '') . (isset($p['op']) ? '/' . $p['op'] : ''));
    $GLOBALS['ctx'] = $journal ? 'mbj' : 'index';
    $s->assign('currentContext', $journal ? new stdClass() : null);
    return $s->fetch('string:' . $m[0]);
};
$portal = $render(false);
if (preg_match('#/index/about#', $portal)) $fail('portal footer links to /index/about*: ' . $portal);
foreach (['href="#pim-about"', 'href="#pim-contact"', '#directoryResultsHeader'] as $want) if (!str_contains($portal, $want)) $fail("portal missing $want");
$journal = $render(true);
foreach (['/mbj/about"', '/mbj/about/submissions"', '/mbj/about/contact"'] as $want) if (!str_contains($journal, $want)) $fail("journal footer missing $want");
$footer = $src;
if (!str_contains($footer, 'id="pim-about"') || !str_contains($footer, 'id="pim-contact"')) $fail('anchor targets missing');
$header = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/components/header.tpl');
if (str_contains($header, '<a href="{url page="about"}">About PIM</a>')) $fail('header About PIM still points at /index/about');
echo "PASS: portal links reach real sections; journal footers keep their About, Guidelines and Contact pages.\n";
