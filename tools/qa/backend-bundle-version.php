<?php
/**
 * Verify the theme re-registers the patched backend bundle (js/build.js) under a new URL,
 * so browsers holding the heuristically cached 3.5.0.4 bundle fetch the patched one.
 * Usage: php tools/qa/backend-bundle-version.php
 */
namespace PKP\plugins {
    class ThemePlugin
    {
        public array $styleCalls = [];
        public function setParent($parent) {}
        public function addStyle($name, $style, $args = []) { $this->styleCalls[] = [$name, $style, $args]; }
    }
    class Hook
    {
        public static array $added = [];
        public static function add($name, $callback) { self::$added[] = [$name, $callback]; }
    }
}

namespace PKP\template {
    class PKPTemplateManager
    {
        public const STYLE_SEQUENCE_LATE = 15;
    }
}

namespace {
    $root = dirname(__DIR__, 2);
    require $root . '/plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php';

    function fail(string $message): void
    {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }

    $plugin = new \APP\plugins\themes\pustakaMinang\PustakaMinangThemePlugin();
    $plugin->init();

    $registered = array_filter(\PKP\plugins\Hook::$added, static fn($entry) => $entry[0] === 'TemplateManager::display'
        && is_array($entry[1]) && $entry[1][0] === $plugin && $entry[1][1] === 'versionBackendBundle');
    if (count($registered) !== 1) {
        fail('init() must register TemplateManager::display => versionBackendBundle exactly once.');
    }

    $backendStyles = array_filter($plugin->styleCalls, static fn($call) => $call[0] === 'pustaka-minang-backend');
    if (array_values($backendStyles) !== [['pustaka-minang-backend', 'styles/pim-backend.css?v=20261127-1', ['contexts' => 'backend']]]) {
        fail('init() must register styles/pim-backend.css?v=20261127-1 for the backend context only.');
    }

    $templateManager = new class {
        public array $scripts = [];
        public function getTemplateVars($name) { return $name === 'baseUrl' ? 'https://journal.example.test' : null; }
        public function addJavaScript($name, $script, $args = []) { $this->scripts[] = [$name, $script, $args]; }
    };

    if (!method_exists($plugin, 'versionBackendBundle')) {
        fail('PustakaMinangThemePlugin::versionBackendBundle() is missing.');
    }
    if ($plugin->versionBackendBundle('TemplateManager::display', [$templateManager]) !== false) {
        fail('versionBackendBundle() must return false so other display hooks still run.');
    }
    $expected = [[
        'pkpApp',
        'https://journal.example.test/js/build.js?v=3.5.0.4-pim.20261127',
        ['priority' => 15, 'contexts' => ['backend']],
    ]];
    if ($templateManager->scripts !== $expected) {
        fail('Expected one pkpApp registration with the versioned bundle URL; got ' . json_encode($templateManager->scripts));
    }

    echo "PASS: Theme serves the patched backend bundle at js/build.js?v=3.5.0.4-pim.20261127.\n";
}
