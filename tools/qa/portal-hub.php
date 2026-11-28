<?php
/**
 * Render the portal hub snippets (indexSite.tpl: pim-hub-hero, pim-hub-about) with Smarty and stub journals.
 * Usage: php tools/qa/portal-hub.php [outFile]   (outFile: write the rendered hero + about HTML for previews)
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
$hero = $s->fetch('string:' . $snip('pim-hub-hero'));
$about = $s->fetch('string:' . $snip('pim-hub-about'));
if (substr_count($hero, 'class="pim-hub-cover"') !== 4) $fail('hero shows one cover per journal that has an image (want 4), got ' . substr_count($hero, 'class="pim-hub-cover"'));
if (!str_contains($hero, '<strong>5</strong><span>journals</span>')) $fail('journal count in the facts strip');
if (!str_contains($hero, 'id="pimHeroSearchForm"') || !str_contains($hero, 'name="query"') || !str_contains($hero, '/index/search/search')) $fail('hero searches articles in all journals');
if (substr_count($hero, '<h1') !== 1) $fail('one h1 in the hero');
if (!str_contains($about, 'id="pim-about"') || !str_contains($about, 'id="pim-contact"')) $fail('About and Contact anchors');
if (str_contains($src, '<h1 class="pim-toolbar-title">')) $fail('directory title must not be a second h1');
if (!str_contains($src, 'pim-card--{$journal->getPath()|escape}')) $fail('cards carry their journal class');
if (!empty($argv[1])) file_put_contents($argv[1], json_encode(['hero' => $hero, 'about' => $about]));
echo "PASS: portal hub renders a hero with article search and covers, a facts strip, and real About and Contact sections.\n";
