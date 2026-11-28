<?php
/**
 * Render the journal identity strip (header.tpl, pim-journal-strip) with Smarty and check the ISSN states.
 * Usage: php tools/qa/journal-strip.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$tpl = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/components/header.tpl');
if (!preg_match('/\{\* pim-journal-strip:start.*?\{\* pim-journal-strip:end \*\}/s', $tpl, $m)) { fwrite(STDERR, "FAIL strip markers not found\n"); exit(1); }
$render = function (array $issn, string $name = 'Minang Bioscience Journal (MBJ)') use ($m) {
    $dir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    $s = new Smarty();
    $s->setCompileDir($dir);
    $s->registerPlugin('function', 'url', fn () => 'https://journal.example.test/mbj/index');
    $s->assign('pimIssn', $issn);
    $s->assign('currentContext', new class($name) { public function __construct(private string $n) {} public function getLocalizedName() { return $this->n; } });
    return $s->fetch('string:' . $m[0]);
};
$fail = function ($msg) { fwrite(STDERR, "FAIL $msg\n"); exit(1); };
$pending = $render(['online' => null, 'print' => null]);
if (!str_contains($pending, 'In process') || str_contains($pending, 'portal.issn.org') || str_contains($pending, '0000-0000')) $fail('placeholder ISSN must read "In process" with no link');
if (str_contains($pending, 'P-ISSN')) $fail('no P-ISSN row without a print ISSN');
$valid = $render(['online' => '2049-3630', 'print' => '0317-8471']);
if (!str_contains($valid, 'href="https://portal.issn.org/resource/ISSN/2049-3630"') || !str_contains($valid, '>2049-3630</a>')) $fail('valid E-ISSN links to the ISSN Portal');
if (!str_contains($valid, 'P-ISSN') || !str_contains($valid, '0317-8471')) $fail('print ISSN shown when valid');
if (str_contains($valid, 'In process')) $fail('no pending text when an ISSN exists');
$escaped = $render(['online' => null, 'print' => null], 'A <b>Journal</b>');
if (str_contains($escaped, '<b>')) $fail('journal name escaped');
echo "PASS: journal strip shows valid ISSNs with ISSN Portal links and \"In process\" for placeholders.\n";
