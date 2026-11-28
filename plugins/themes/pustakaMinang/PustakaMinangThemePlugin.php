<?php
/**
 * @file plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php
 *
 * Custom theme for Pustaka Inspirasi Minang.
 */

namespace APP\plugins\themes\pustakaMinang;

class PustakaMinangThemePlugin extends \PKP\plugins\ThemePlugin
{
    /**
     * Cache key for the locally patched OJS backend bundle (js/build.js).
     * Change it whenever js/build.js changes: the host sends no Cache-Control for the
     * bundle, so browsers keep the previous copy until its URL changes.
     */
    public const BACKEND_BUNDLE_VERSION = '3.5.0.4-pim.20261127';

    /**
     * Initialize the theme's styles, scripts and hooks.
     */
    public function init()
    {
        // Inherit all styles, scripts, and behaviors from the default theme
        $this->setParent('defaultthemeplugin');

        // Add our custom CSS overrides for MDPI-style UI/UX and Marawa branding
        $this->addStyle('pustaka-minang-layout', 'styles/pim-layout.css?v=20261014-4');
        $this->addStyle('pustaka-minang-style', 'styles/custom.css');
        // Design system v2 for the public shell; must stay after the two layers above.
        $this->addStyle('pustaka-minang-v2', 'styles/pim-v2.css?v=20261127-4');
        // Refinement layer v2.1 (article, issue, archive, custom pages, account shell); after v2.
        $this->addStyle('pustaka-minang-refine', 'styles/pim-refine.css?v=20261128-1');
        // Layer v2.2: per-journal palette from each logo and HeroUI-style components; after refine.
        $this->addStyle('pustaka-minang-hero', 'styles/pim-hero.css?v=20261128-3');

        // Editorial (backend) shell fixes for phones and contrast; never loaded on public pages.
        $this->addStyle('pustaka-minang-backend', 'styles/pim-backend.css?v=20261127-1', ['contexts' => 'backend']);

        // Hook into TemplateManager to register custom Smarty modifiers for views/downloads stats
        \PKP\plugins\Hook::add('TemplateManager::display', [$this, 'registerSmartyModifiers']);

        // Serve the patched backend bundle under its own cache key.
        \PKP\plugins\Hook::add('TemplateManager::display', [$this, 'versionBackendBundle']);
        // ISSN for the journal strip, and no placeholder ISSN in Google Scholar / Dublin Core meta.
        \PKP\plugins\Hook::add('TemplateManager::display', [$this, 'prepareIssn']);
        // Current issue id so the journal menu marks Current Issue on /issue/view/{current id}.
        \PKP\plugins\Hook::add('TemplateManager::display', [$this, 'prepareIssueNav']);
    }

    /**
     * PIM 20261128: /issue/current redirects to /issue/view/{id}, so the menu could not tell it was on
     * the current issue. Assign its id on issue pages only (one query).
     */
    public function prepareIssueNav($hookName, $args)
    {
        $request = \APP\core\Application::get()->getRequest();
        $context = $request ? $request->getContext() : null;
        if ($context && $request->getRequestedPage() === 'issue') {
            $current = \APP\facades\Repo::issue()->getCurrent($context->getId());
            $args[0]->assign('pimCurrentIssueId', $current ? $current->getId() : null);
        }
        return false;
    }

    /**
     * Return a well-formed ISSN ("1234-567X") or null for empty, all-zero placeholders
     * such as "0000-0000", malformed values and values with a wrong check digit.
     */
    public static function validIssn($issn): ?string
    {
        $issn = strtoupper(trim((string) $issn));
        if (!preg_match('/^(\d{4})-?(\d{3})([\dX])$/', $issn, $m)) {
            return null;
        }
        $digits = $m[1] . $m[2];
        if ($digits === '0000000') {
            return null;
        }
        $sum = 0;
        for ($i = 0; $i < 7; $i++) {
            $sum += (int) $digits[$i] * (8 - $i);
        }
        $check = (11 - $sum % 11) % 11;
        $expected = $check === 10 ? 'X' : (string) $check;
        return $expected === $m[3] ? $m[1] . '-' . $m[2] . $m[3] : null;
    }

    /**
     * PIM 20261128: expose valid ISSNs to templates (journal strip) and stop placeholder ISSNs
     * ("0000-0000") from reaching indexers. The Google Scholar and Dublin Core plugins emit the
     * first non-empty ISSN as-is; their headers are replaced with the first valid ISSN, or emptied.
     */
    public function prepareIssn($hookName, $args)
    {
        $templateMgr = $args[0];
        $request = \APP\core\Application::get()->getRequest();
        $context = $request ? $request->getContext() : null;
        if (!$context) {
            return false;
        }
        $online = self::validIssn($context->getData('onlineIssn'));
        $print = self::validIssn($context->getData('printIssn'));
        $templateMgr->assign('pimIssn', ['online' => $online, 'print' => $print]);

        $raw = null;
        foreach (['onlineIssn', 'printIssn', 'issn'] as $key) {
            $value = trim((string) $context->getData($key));
            if ($value !== '') {
                $raw = $value;
                break;
            }
        }
        $valid = $online ?: ($print ?: self::validIssn($context->getData('issn')));
        if ($raw !== null && $valid !== $raw) {
            $page = $request->getRequestedPage();
            $emit = $valid && in_array($page, ['article', 'issue'], true);
            $templateMgr->addHeader('googleScholarIssn', $emit ? '<meta name="citation_issn" content="' . htmlspecialchars($valid) . '"/>' : '');
            $templateMgr->addHeader('dublinCoreIssn', $emit ? '<meta name="DC.Source.ISSN" content="' . htmlspecialchars($valid) . '"/>' : '');
        }
        return false;
    }

    /**
     * Re-register the core "pkpApp" bundle with a PIM version so cached copies are replaced.
     * The URL already contains "?", so OJS does not append its own "?v=<app version>".
     */
    public function versionBackendBundle($hookName, $args)
    {
        $templateMgr = $args[0];
        $templateMgr->addJavaScript(
            'pkpApp',
            $templateMgr->getTemplateVars('baseUrl') . '/js/build.js?v=' . self::BACKEND_BUNDLE_VERSION,
            [
                'priority' => \PKP\template\PKPTemplateManager::STYLE_SEQUENCE_LATE,
                'contexts' => ['backend'],
            ]
        );
        return false;
    }

    /**
     * Register custom smarty modifiers on the Template Manager
     */
    public function registerSmartyModifiers($hookName, $args)
    {
        $templateMgr = $args[0];
        // PIM 20261127: display() can run more than once per request (e.g. a page plus an AJAX
        // fragment); registering twice threw "Plugin tag ... already registered" (597 log entries).
        $modifiers = [
            'pim_article_views' => [$this, 'getArticleViews'],
            'pim_article_downloads' => [$this, 'getArticleDownloads'],
            'pim_normalize_editorial_team_urls' => [$this, 'normalizeEditorialTeamUrls'],
        ];
        foreach ($modifiers as $name => $callback) {
            if (empty($templateMgr->registered_plugins['modifier'][$name])) {
                $templateMgr->registerPlugin('modifier', $name, $callback);
            }
        }
        return false;
    }

    /** Keep configured links visible and repair only obsolete local OJS routes. */
    public function normalizeEditorialTeamUrls($sidebarCode, $mastheadUrl)
    {
        $sidebarCode = (string) $sidebarCode;
        $mastheadUrl = (string) $mastheadUrl;
        $mastheadPath = parse_url($mastheadUrl, PHP_URL_PATH);
        if (!$mastheadPath || !str_ends_with($mastheadPath, '/about/editorialMasthead')) {
            return $sidebarCode;
        }
        $journalPath = substr($mastheadPath, 0, -strlen('/about/editorialMasthead'));
        $journalBasePath = substr($journalPath, 0, strrpos($journalPath, '/'));
        $obsoleteRoutePattern = '~^' . preg_quote($journalBasePath, '~')
            . '/[^/]+/(?:about/)?editorialTeam$|^' . preg_quote($journalBasePath, '~')
            . '/[^/]+/editorialMasthead$~i';
        $host = strtolower((string) parse_url($mastheadUrl, PHP_URL_HOST));
        $filtered = preg_replace_callback(
            // Consume quoted attribute values as whole tokens so data-href
            // and text such as title='Route href="..."' are never rewritten.
            '~(<a\b(?:"[^"]*"|\'[^\']*\'|[^\'">])*?\s+href\s*=\s*)([\'"])(.*?)\2((?:"[^"]*"|\'[^\']*\'|[^\'">])*?>)(.*?)(</a>)~isu',
            static function ($matches) use ($obsoleteRoutePattern, $host, $mastheadUrl) {
                $label = html_entity_decode(strip_tags($matches[5]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                if (strcasecmp(trim((string) preg_replace('/\s+/u', ' ', $label)), 'Editorial Team') !== 0) {
                    return $matches[0];
                }
                $href = html_entity_decode($matches[3], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $link = parse_url($href);
                if ($link === false || (isset($link['host']) && strtolower($link['host']) !== $host)
                    || (isset($link['scheme']) && !in_array(strtolower($link['scheme']), ['http', 'https'], true))) {
                    return $matches[0];
                }
                $path = rtrim($link['path'] ?? '', '/');
                // Old copied blocks can point to a different journal's removed
                // operation. Repair only known obsolete routes within this site.
                if (!preg_match($obsoleteRoutePattern, $path)) {
                    return $matches[0];
                }
                return $matches[1] . $matches[2] . htmlspecialchars($mastheadUrl, ENT_QUOTES, 'UTF-8')
                    . $matches[2] . $matches[4] . $matches[5] . $matches[6];
            },
            $sidebarCode
        );
        return $filtered ?? $sidebarCode;
    }

    /**
     * Get views count for a submission
     */
    public function getArticleViews($articleId)
    {
        if (!$articleId) return 0;
        try {
            return (int) \Illuminate\Support\Facades\DB::table('metrics_submission')
                ->where('submission_id', (int)$articleId)
                ->where('assoc_type', 16777225) // ASSOC_TYPE_SUBMISSION
                ->sum('metric');
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Get downloads count for a submission
     */
    public function getArticleDownloads($articleId)
    {
        if (!$articleId) return 0;
        try {
            return (int) \Illuminate\Support\Facades\DB::table('metrics_submission')
                ->where('submission_id', (int)$articleId)
                ->where('assoc_type', 515) // ASSOC_TYPE_SUBMISSION_FILE
                ->sum('metric');
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Get the display name of this plugin
     *
     * @return string
     */
    public function getDisplayName()
    {
        return 'Pustaka Inspirasi Minang Theme';
    }

    /**
     * Get the description of this plugin
     *
     * @return string
     */
    public function getDescription()
    {
        return 'A premium academic theme with modern UI/UX inspired by MDPI and GPI Journal, styled with traditional Minang Marawa colors and design accents.';
    }
}

