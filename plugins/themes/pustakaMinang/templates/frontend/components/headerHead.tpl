{**
 * plugins/themes/pustakaMinang/templates/frontend/components/headerHead.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2000-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Custom site header <head> tag and contents for pustakaMinang theme.
 *}
<head>
	<meta charset="{$defaultCharset|escape}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	{capture assign="pimDocumentTitle"}{$pageTitleTranslated|strip_tags|trim}{/capture}
	{if !$pimDocumentTitle}
		{if $currentContext && $currentContext->getLocalizedName()}
			{assign var="pimDocumentTitle" value=$currentContext->getLocalizedName()}
		{else}
			{assign var="pimDocumentTitle" value=$siteTitle|default:"PIM Journal Portal"}
		{/if}
	{/if}
	<title>{$pimDocumentTitle|escape}{if $requestedPage|escape|default:"index" != 'index' && $currentContext && $currentContext->getLocalizedName()} | {$currentContext->getLocalizedName()|escape}{/if}</title>

	{* Add favicon from the site root *}
	<link rel="icon" href="{$baseUrl}/favicon.png" type="image/png">
	<link rel="shortcut icon" href="{$baseUrl}/favicon.png" type="image/png">

	{load_header context="frontend"}
	{load_stylesheet context="frontend"}
</head>
