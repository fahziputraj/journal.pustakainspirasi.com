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
     * Initialize the theme's styles, scripts and hooks.
     */
    public function init()
    {
        // Inherit all styles, scripts, and behaviors from the default theme
        $this->setParent('defaultthemeplugin');

        // Add our custom CSS overrides for MDPI-style UI/UX and Marawa branding
        $this->addStyle('pustaka-minang-layout', 'styles/pim-layout.css?v=20260814-2');
        $this->addStyle('pustaka-minang-style', 'styles/custom.css');

        // Hook into TemplateManager to register custom Smarty modifiers for views/downloads stats
        \PKP\plugins\Hook::add('TemplateManager::display', [$this, 'registerSmartyModifiers']);
    }

    /**
     * Register custom smarty modifiers on the Template Manager
     */
    public function registerSmartyModifiers($hookName, $args)
    {
        $templateMgr = $args[0];
        $templateMgr->registerPlugin('modifier', 'pim_article_views', [$this, 'getArticleViews']);
        $templateMgr->registerPlugin('modifier', 'pim_article_downloads', [$this, 'getArticleDownloads']);
        $templateMgr->registerPlugin('modifier', 'pim_remove_duplicate_editorial_team', [$this, 'removeDuplicateEditorialTeamLinks']);
        return false;
    }

    /**
     * Remove legacy custom-block entries that duplicate the theme's native,
     * context-aware Editorial Team link.
     *
     * Editorial History entries are deliberately preserved. The match is
     * based on the rendered link label, not a journal path or deprecated URL.
     */
    public function removeDuplicateEditorialTeamLinks($sidebarCode)
    {
        $sidebarCode = (string) $sidebarCode;
        $isEditorialTeamLink = static function ($linkHtml) {
            $label = html_entity_decode(strip_tags($linkHtml), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $label = preg_replace('/\s+/u', ' ', trim($label));
            return strcasecmp((string) $label, 'Editorial Team') === 0;
        };

        $filtered = preg_replace_callback(
            '~<li\b[^>]*>.*?</li>~isu',
            static function ($matches) use ($isEditorialTeamLink) {
                if (preg_match('~<a\b[^>]*>(.*?)</a>~isu', $matches[0], $linkMatch)
                    && $isEditorialTeamLink($linkMatch[1])) {
                    return '';
                }
                return $matches[0];
            },
            $sidebarCode
        );

        if ($filtered === null) {
            return $sidebarCode;
        }

        $filteredWithoutStandaloneLinks = preg_replace_callback(
            '~<a\b[^>]*>(.*?)</a>~isu',
            static function ($matches) use ($isEditorialTeamLink) {
                return $isEditorialTeamLink($matches[1]) ? '' : $matches[0];
            },
            $filtered
        );

        return $filteredWithoutStandaloneLinks === null ? $filtered : $filteredWithoutStandaloneLinks;
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

