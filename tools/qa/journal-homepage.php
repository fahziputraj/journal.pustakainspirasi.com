<?php
/** Render the actual homepage introduction without an OJS database. */
$root = dirname(__DIR__, 2);
require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$source = file_get_contents($root . '/plugins/themes/pustakaMinang/templates/frontend/pages/indexJournal.tpl');
$start = strpos($source, '{* Journal Cover Image');
$end = strpos($source, '{* Additional Home Content');
if ($start === false || $end === false) {
    throw new RuntimeException('Homepage introduction markers not found.');
}
$fragment = substr($source, $start, $end - $start);
function renderIntro(string $fragment, string $name, string $description, ?array $image, string $publicFiles, bool $headerImage = false): string
{
    $compileDir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($compileDir)) mkdir($compileDir, 0700, true);
    $smarty = new Smarty();
    $smarty->setCompileDir($compileDir);
    $journal = new class($name, $description) {
        public function __construct(private string $name, private string $description) {}
        public function getLocalizedName() { return $this->name; }
        public function getLocalizedData($key) { return $key === 'description' ? $this->description : null; }
    };
    $smarty->assign([
        'homepageImage' => $image,
        'currentContext' => $journal,
        'currentJournal' => $journal,
        'publicFilesDir' => $publicFiles,
        'activeTheme' => new class($headerImage) {
            public function __construct(private bool $headerImage) {}
            public function getOption($key) { return $this->headerImage; }
        },
    ]);
    return $smarty->fetch('string:' . $fragment);
}
if (($argv[1] ?? '') === '--render') {
    $previous = libxml_use_internal_errors(true);
    $document = new DOMDocument();
    $document->loadHTML(file_get_contents($argv[2]));
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    $xpath = new DOMXPath($document);
    $name = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " page_index_journal ")]//h1')->item(0)->textContent;
    $descriptionNode = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " gp-journal-description ")]')->item(0);
    $description = '';
    if ($descriptionNode) foreach ($descriptionNode->childNodes as $child) $description .= $document->saveHTML($child);
    $imageNode = $xpath->query('//*[@data-gp-official-home-image]//img')->item(0);
    $image = $imageNode ? ['uploadName' => basename($imageNode->getAttribute('src')), 'altText' => $imageNode->getAttribute('alt')] : null;
    echo renderIntro($fragment, trim($name), $description, $image, $imageNode ? dirname($imageNode->getAttribute('src')) : '');
    exit;
}
foreach ([['', null], ['<p>Research introduction.</p>', null], ['', ['uploadName' => 'cover.png']], ['<p>Research introduction.</p>', ['uploadName' => 'cover.png', 'altText' => 'Official cover']]] as [$description, $image]) {
    $html = renderIntro($fragment, 'Research & Science Journal', $description, $image, '/public/journals/1');
    if (substr_count($html, '<h1 class="pim-journal-title">') !== 1 || !str_contains($html, 'Research &amp; Science Journal')) {
        throw new RuntimeException('Exactly one visible, escaped journal title is required for every intro state.');
    }
    if ($description && !str_contains($html, $description)) throw new RuntimeException('Authored description must remain.');
    if ($image && !preg_match('/<img[^>]+alt="[^"\s][^"]*"[^>]+width="132" height="188"/', $html)) {
        throw new RuntimeException('Cover requires alternative text and stable frame dimensions.');
    }
    if (!$image && str_contains($html, '<img')) throw new RuntimeException('Missing image must not render a broken cover.');
}
$headerHtml = renderIntro($fragment, 'Header Image Journal', '', ['uploadName' => 'cover.png'], '/public/journals/1', true);
if (str_contains($headerHtml, '<img') || substr_count($headerHtml, '<h1 class="pim-journal-title">') !== 1) throw new RuntimeException('Header-image mode retains the title without a duplicate cover.');
echo "PASS: Actual Smarty intro renders one visible title, intact description, accessible cover and empty/header-image states.\n";
