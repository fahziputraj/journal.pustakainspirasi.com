<?php
/**
 * Render the real portal card thumbnail snippet with Smarty: cover first, then thumbnail, then placeholder.
 * Usage: php tools/qa/portal-cards.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$source = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/pages/indexSite.tpl');
if (!preg_match('~\{\* pim-card-thumb:start \*\}.*?\{\* pim-card-thumb:end \*\}~s', $source, $snippet)) {
    fwrite(STDERR, "FAIL: card thumbnail snippet markers not found in indexSite.tpl\n");
    exit(1);
}
$compileDir = sys_get_temp_dir() . '/pim-theme-qa';
if (!is_dir($compileDir)) {
    mkdir($compileDir, 0700, true);
}
function journal(?array $cover, ?array $thumb): object
{
    return new class($cover, $thumb) {
        public function __construct(private ?array $cover, private ?array $thumb) {}
        public function getId() { return 1; }
        public function getLocalizedData($key) { return $key === 'homepageImage' ? $this->cover : ($key === 'journalThumbnail' ? $this->thumb : null); }
    };
}
function render(string $source, object $journal): string
{
    global $compileDir;
    $smarty = new Smarty();
    $smarty->setCompileDir($compileDir);
    $smarty->assign(['journal' => $journal, 'journalFilesPath' => '/public/journals/']);
    return $smarty->fetch('string:' . $source);
}
$cases = [
    ['cover', journal(['uploadName' => 'homepageImage_en.png', 'width' => 595, 'height' => 842], ['uploadName' => 'logo.png']), 'src="/public/journals/1/homepageImage_en.png"', 'width="595" height="842"'],
    ['thumbnailOnly', journal(null, ['uploadName' => 'journalThumbnail_en.png', 'width' => 300, 'height' => 120]), 'src="/public/journals/1/journalThumbnail_en.png"', 'width="300" height="120"'],
    ['placeholder', journal(null, null), 'pim-card-thumb-placeholder', ''],
];
foreach ($cases as [$name, $journal, $expected, $dims]) {
    $html = render($snippet[0], $journal);
    if (!str_contains($html, $expected) || ($dims && !str_contains($html, $dims))) {
        fwrite(STDERR, "FAIL: {$name}\n{$html}\n");
        exit(1);
    }
}
echo "PASS: Portal cards prefer the journal cover, fall back to the thumbnail, then a placeholder.\n";
