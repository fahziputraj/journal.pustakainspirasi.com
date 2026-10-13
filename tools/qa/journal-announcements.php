<?php
/** Render the real Journal Menu group with announcements enabled and disabled. */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$source = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/components/header.tpl');
if (!preg_match('~<div class="pim-journal-tools-group">.*?</div>~s', $source, $group)) {
    throw new RuntimeException('Journal Menu content group not found.');
}
$compileDir = sys_get_temp_dir() . '/pim-theme-qa';
if (!is_dir($compileDir)) {
    mkdir($compileDir, 0700, true);
}
foreach ([false, true] as $enabled) {
    $smarty = new Smarty();
    $smarty->setCompileDir($compileDir);
    $smarty->registerPlugin('function', 'url', static fn($params) => '/mmj/' . $params['page']);
    $smarty->assign([
        'baseUrl' => 'https://journal.example.test',
        'requestedPage' => 'index',
        'currentContext' => new class($enabled) {
            public function __construct(private bool $enabled) {}
            public function getData($key) { return $key === 'enableAnnouncements' ? $this->enabled : null; }
        },
    ]);
    $html = $smarty->fetch('string:' . $group[0]);
    $count = substr_count($html, 'href="/mmj/announcement"');
    if ($count !== ($enabled ? 1 : 0)) {
        fwrite(STDERR, 'FAIL: Announcements menu must follow the journal setting; enabled=' . (int) $enabled . "\n");
        exit(1);
    }
    if (!str_contains($html, 'href="/mmj/search"')) {
        throw new RuntimeException('Other Journal Menu actions must remain available.');
    }
}
echo "PASS: Actual Journal Menu includes Announcements only when enabled and retains Search.\n";
