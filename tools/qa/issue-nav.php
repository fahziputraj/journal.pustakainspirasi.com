<?php
/**
 * Journal menu marks Current Issue on /issue/view/{current id} (where /issue/current redirects) and
 * Archives for other issues; an issue without a cover falls back to the journal's own homepage image.
 * Usage: php tools/qa/issue-nav.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$fail = function ($m) { fwrite(STDERR, "FAIL $m\n"); exit(1); };
$snippet = function ($file, $name) use ($root, $fail) {
    $src = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/' . $file);
    if (!preg_match('/\{\* ' . $name . ':start.*?\{\* ' . $name . ':end \*\}/s', $src, $m)) $fail("$name markers not found in $file");
    return $m[0];
};
$render = function ($src, array $vars) {
    $dir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    $s = new Smarty();
    $s->setCompileDir($dir);
    $s->registerPlugin('function', 'url', fn ($p) => '/mbj/' . ($p['page'] ?? '') . '/' . ($p['op'] ?? ''));
    $s->assign($vars);
    return $s->fetch('string:' . $src);
};
$issue = fn ($id) => new class($id) { public function __construct(private int $id) {} public function getId() { return $this->id; } };
$nav = $snippet('components/header.tpl', 'pim-issue-nav');
$active = function ($html) { preg_match_all('/class="is-active"><i class="fas fa-[\w-]+"><\/i> ([\w ]+)</', $html, $m); return $m[1]; };
$cases = [
    'redirected current issue' => [['requestedPage' => 'issue', 'requestedOp' => 'view', 'issue' => $issue(13), 'pimCurrentIssueId' => 13], ['Current Issue']],
    'older issue' => [['requestedPage' => 'issue', 'requestedOp' => 'view', 'issue' => $issue(9), 'pimCurrentIssueId' => 13], ['Archives']],
    'archive page' => [['requestedPage' => 'issue', 'requestedOp' => 'archive', 'issue' => null, 'pimCurrentIssueId' => 13], ['Archives']],
    'current op' => [['requestedPage' => 'issue', 'requestedOp' => 'current', 'issue' => null, 'pimCurrentIssueId' => null], ['Current Issue']],
    'home page' => [['requestedPage' => 'index', 'requestedOp' => 'index', 'issue' => null, 'pimCurrentIssueId' => null], []],
];
foreach ($cases as $label => [$vars, $want]) {
    $got = $active($render($nav, $vars));
    if ($got !== $want) $fail("$label: active " . json_encode($got) . ', want ' . json_encode($want));
}
$cover = $snippet('pages/indexJournal.tpl', 'pim-fallback-cover') . '{$pimFallbackCover}';
$journal = fn ($img) => new class($img) { public function __construct(private $img) {} public function getLocalizedData($k) { return $k === 'homepageImage' ? $this->img : null; } };
$with = $render($cover, ['currentJournal' => $journal(['uploadName' => 'homepageImage_en.png']), 'publicFilesDir' => '/public/journals/1', 'baseUrl' => 'https://j.test']);
if (trim($with) !== '/public/journals/1/homepageImage_en.png') $fail('fallback uses the journal homepage image, got ' . trim($with));
$without = $render($cover, ['currentJournal' => $journal(null), 'publicFilesDir' => '/public/journals/1', 'baseUrl' => 'https://j.test']);
if (trim($without) !== 'https://j.test/default_journal_issue_cover.png') $fail('no journal image keeps the site default, got ' . trim($without));
echo "PASS: Current Issue is active on the redirected current issue, Archives on others; covers fall back to the journal image.\n";
