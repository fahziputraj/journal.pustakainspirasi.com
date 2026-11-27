<?php
/**
 * Render the real header brand, footer logo and favicon snippets with Smarty (no database).
 * Usage: php tools/qa/brand-templates.php
 */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$components = $root . '/plugins/themes/pustakaMinang/templates/frontend/components/';

function snippet(string $file, string $pattern, string $label): string
{
    if (!preg_match($pattern, file_get_contents($file), $m)) {
        fail("{$label} snippet not found in " . basename($file));
    }
    return $m[0];
}
function fail(string $message): void
{
    fwrite(STDERR, "FAIL: {$message}\n");
    exit(1);
}
function render(string $source, array $vars): string
{
    $compileDir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($compileDir)) {
        mkdir($compileDir, 0700, true);
    }
    $smarty = new Smarty();
    $smarty->setCompileDir($compileDir);
    $smarty->assign($vars + ['baseUrl' => 'https://journal.example.test', 'siteTitle' => 'PIM Portal']);
    return $smarty->fetch('string:' . $source);
}
function context(?array $favicon): object
{
    return new class($favicon) {
        public function __construct(private ?array $favicon) {}
        public function getLocalizedName() { return 'Minang Bioscience Journal (MBJ)'; }
        public function getLocalizedFavicon() { return $this->favicon; }
    };
}
function expect(bool $condition, string $case, string $html): void
{
    if (!$condition) {
        fail("{$case}\n{$html}");
    }
}

$footer = snippet($components . 'footer.tpl', '~<div class="footer-logo-mark">.*?</div>~s', 'Footer logo');
$brand = snippet($components . 'header.tpl', '~<a class="pim-brand".*?</a>~s', 'Header brand');
$favicon = snippet($components . 'headerHead.tpl', '~\{\* pim-favicon:start \*\}.*?\{\* pim-favicon:end \*\}~s', 'Favicon');
$logoUrl = '/plugins/themes/pustakaMinang/images/pim-logo.png?v=20261127';

$html = render($footer, ['displayPageHeaderLogo' => ['uploadName' => 'logo.png'], 'publicFilesDir' => '/public/journals/1', 'currentContext' => context(null)]);
expect(str_contains($html, $logoUrl) && str_contains($html, 'alt="Pustaka Inspirasi Minang"')
    && preg_match('~width="\d+"~', $html) && str_contains($html, 'height="48"') && !str_contains($html, '/public/journals/1/logo.png'),
    'footerJournalContext: footer must always show the PIM logo with dimensions', $html);

$html = render($brand, ['displayPageHeaderLogo' => null, 'publicFilesDir' => '/public/site', 'currentContext' => null]);
expect(str_contains($html, $logoUrl) && str_contains($html, 'width="344" height="240"') && !str_contains($html, 'example.test/logo.png'),
    'headerFallback: missing uploaded logo must fall back to the theme PIM logo', $html);

$html = render($brand, ['displayPageHeaderLogo' => ['uploadName' => 'pageHeaderTitleImage_en.png', 'width' => 1672, 'height' => 941], 'publicFilesDir' => '/public/site', 'currentContext' => null]);
expect(str_contains($html, 'src="/public/site/pageHeaderTitleImage_en.png"') && str_contains($html, 'width="1672" height="941"'),
    'headerUploaded: uploaded logo keeps its source and gains stored dimensions', $html);

$html = render($favicon, ['currentContext' => null]);
expect(str_contains($html, 'href="https://journal.example.test/favicon.ico" sizes="any"')
    && str_contains($html, 'images/favicon-32.png?v=20261127') && str_contains($html, 'rel="apple-touch-icon"'),
    'noContextFavicon: theme favicon links render', $html);

$html = render($favicon, ['currentContext' => context(['uploadName' => 'favicon_en.png'])]);
expect(substr_count($html, 'rel="icon"') === 0 && substr_count($html, 'apple-touch-icon') === 0,
    'contextFavicon: a journal favicon uploaded in OJS must not be overridden', $html);

echo "PASS: Header, footer and favicon render the PIM brand assets and respect uploaded logos and favicons.\n";
