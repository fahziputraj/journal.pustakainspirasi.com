{**
 * plugins/themes/pustakaMinang/templates/frontend/pages/editorialMasthead.tpl
 *
 * Copyright (c) Pustaka Inspirasi Minang
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Display the configured Editorial History on the public masthead route.
 *
 * Editorial History is stored and sanitized by OJS through the context masthead
 * settings form. Keep this output unescaped so the editor's allowed formatting
 * (for example paragraphs, bold text, and hyperlinks) is preserved.
 *}
{include file="frontend/components/header.tpl" pageTitle="common.editorialMasthead"}

<div class="page page_masthead">
	{include file="frontend/components/breadcrumbs.tpl" currentTitleKey="common.editorialMasthead"}

	<h1>{translate key="common.editorialMasthead"}</h1>
	{assign var="editorialHistory" value=$currentContext->getLocalizedData('editorialHistory')}
	{if $editorialHistory|strip_tags|trim}
		{$editorialHistory}
	{else}
		<div class="cmp_notification notice">{translate key="common.notAvailable"}</div>
	{/if}
</div><!-- .page -->

{include file="frontend/components/footer.tpl"}
