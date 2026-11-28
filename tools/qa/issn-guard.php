<?php
/**
 * PustakaMinangThemePlugin::validIssn() keeps real ISSNs and drops placeholders (PIM 20261128).
 * Usage: php tools/qa/issn-guard.php
 */
$src = file_get_contents(__DIR__ . '/../../plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php');
if (!preg_match('/public static function validIssn\(\$issn\): \?string\r?\n    \{(.*?)\r?\n    \}\r?\n/s', $src, $m)) { fwrite(STDERR, "FAIL validIssn() not found\n"); exit(1); }
$validIssn = eval('return function ($issn): ?string {' . $m[1] . '};');
$cases = [
    ['0000-0000', null], ['', null], [null, null], ['xxxx-xxxx', null], ['1234-5678', null],
    ['0317-8471', '0317-8471'], ['2049-3630', '2049-3630'], ['1234-5679', '1234-5679'], ['03178471', '0317-8471'], [' 2434-561x ', '2434-561X'],
];
$fail = 0;
foreach ($cases as [$in, $want]) {
    $got = $validIssn($in);
    if ($got !== $want) { $fail++; fwrite(STDERR, 'FAIL ' . var_export($in, true) . ' -> ' . var_export($got, true) . ', want ' . var_export($want, true) . "\n"); }
}
if ($fail) exit(1);
echo "PASS: validIssn() keeps real ISSNs (check digit) and drops 0000-0000 and malformed values.\n";
