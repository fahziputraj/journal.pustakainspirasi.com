<?php
/** Render the real theme footer without a database or a running OJS instance. */
namespace PKP\plugins {
    class ThemePlugin {}
}

namespace {
    $root = dirname(__DIR__, 2);
    require $root . '/lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
    require $root . '/plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php';

    $smarty = new \Smarty();
    $compileDir = sys_get_temp_dir() . '/pim-theme-qa';
    if (!is_dir($compileDir)) {
        mkdir($compileDir, 0700, true);
    }
    $smarty->setCompileDir($compileDir);
    $smarty->error_reporting = E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED;
    $smarty->registerPlugin('function', 'translate', static fn($params) => $params['key']);
    $smarty->registerPlugin('function', 'url', static fn() => '/mbj/index');
    $smarty->registerPlugin('function', 'load_script', static fn() => '');
    $smarty->registerPlugin('modifier', 'trim', 'trim');
    $plugin = new \APP\plugins\themes\pustakaMinang\PustakaMinangThemePlugin();
    if (method_exists($plugin, 'removeDuplicateEditorialTeamLinks')) {
        $smarty->registerPlugin('modifier', 'pim_remove_duplicate_editorial_team', [$plugin, 'removeDuplicateEditorialTeamLinks']);
    }

    $sidebar = '<div class="pkp_block block_custom" id="customblock-sidebarrye"><div class="content">'
        . '<h2>People</h2><table><tr><td><a href="/mbj/EditorialTeam"><span>Editorial Team</span></a></td></tr>'
        . '<tr><td><a href="/mbj/Reviewer">Reviewers</a></td></tr></table>'
        . '<ul><li><a href="/mbj/about/editorialHistory">Editorial History</a></li></ul></div></div>';
    $smarty->registerPlugin('function', 'call_hook', static fn($params) => $params['name'] === 'Templates::Common::Sidebar' ? $sidebar : '');
    $smarty->assign([
        'currentContext' => new class {
            public function getData($key) { return ''; }
        },
        'requestedPage' => 'index',
        'displayPageHeaderLogo' => false,
        'baseUrl' => 'https://journal.example.test',
    ]);
    $html = $smarty->fetch($root . '/plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl');
    if (!str_contains($html, $sidebar)) {
        fwrite(STDERR, "FAIL: The public sidebar must preserve configured Editorial Team, Reviewers, and Editorial History links and their targets.\n");
        exit(1);
    }
    if (substr_count($html, 'id="pimJournalLinksPanel"') !== 1) {
        fwrite(STDERR, "FAIL: Sidebar navigation must render once.\n");
        exit(1);
    }
    echo "PASS: Actual Smarty footer preserves the complete configured sidebar and renders one links panel.\n";
}
