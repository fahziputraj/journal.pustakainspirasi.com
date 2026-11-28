<?php
/**
 * Render the portal About/Contact snippet (indexSite.tpl: pim-hub-about) with Smarty and stub journals.
 * Usage: php tools/qa/portal-hub.php [outFile]   (outFile: write the rendered About/Contact HTML for previews)
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$fail = function ($m) { fwrite(STDERR, "FAIL $m\n"); exit(1); };
$src = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/pages/indexSite.tpl');
$snip = function ($name) use ($src, $fail) { if (!preg_match('/\{\* ' . $name . ':start.*?\{\* ' . $name . ':end \*\}/s', $src, $m)) $fail("$name markers missing"); return $m[0]; };
$journal = fn ($id, $path, $img) => new class($id, $path, $img) {
    public function __construct(private $id, private $path, private $img) {}
    public function getId() { return $this->id; }
    public function getPath() { return $this->path; }
    public function getLocalizedData($k) { return $k === 'homepageImage' && $this->img ? ['uploadName' => $this->img] : null; }
};
$journals = [$journal(1, 'mbj', 'homepageImage_en.png'), $journal(2, 'mcj', 'cover.png'), $journal(3, 'mcsj', 'cover.png'), $journal(4, 'mmj', 'homepageImage_en.png'), $journal(5, 'mpj', null)];
$dir = sys_get_temp_dir() . '/pim-theme-qa';
if (!is_dir($dir)) mkdir($dir, 0700, true);
$s = new Smarty();
$s->setCompileDir($dir);
$s->registerPlugin('function', 'url', fn ($p) => 'https://journal.pustakainspirasi.com/index/' . ($p['page'] ?? '') . (isset($p['op']) ? '/' . $p['op'] : ''));
$s->assign(['journals' => $journals, 'journalFilesPath' => 'https://journal.pustakainspirasi.com/public/journals/']);
$about = $s->fetch('string:' . $snip('pim-hub-about'));
if (!str_contains($about, 'id="pim-about"') || !str_contains($about, 'id="pim-contact"')) $fail('About and Contact anchors');
if (str_contains($src, 'pim-hub-hero')) $fail('no hero on the portal (user decision 28 Nov)');
if (substr_count($src, '<h1') !== 1 || !str_contains($src, '<h1 class="pim-toolbar-title">Journal Directory</h1>')) $fail('the directory title is the single h1');
if (!str_contains($src, 'pim-card--{$journal->getPath()|escape}')) $fail('cards carry their journal class');
if (!empty($argv[1])) file_put_contents($argv[1], json_encode(['about' => $about]));
echo "PASS: portal has no hero, keeps one h1 (Journal Directory), journal-coloured cards and real About and Contact sections.\n";
