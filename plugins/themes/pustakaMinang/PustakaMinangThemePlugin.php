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
        $this->addStyle('pustaka-minang-layout', 'styles/pim-layout.css');
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
        return false;
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

