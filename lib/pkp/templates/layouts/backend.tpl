{**
 * lib/pkp/templates/layouts/backend.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Common site header.
 *
 * @hook Template::Layout::Backend::HeaderActions []
 *}
<!DOCTYPE html>
<html lang="{$currentLocale|replace:"_":"-"}" xml:lang="{$currentLocale|replace:"_":"-"}">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset={$defaultCharset|escape}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{title|strip_tags value=$pageTitle}</title>
	{load_header context="backend"}
	{load_stylesheet context="backend"}
	{load_script context="backend"}
	<style type="text/css">
		/* Prevent flash of unstyled content in some browsers */
		[v-cloak] { display: none; }
		.pim-admin-nav-toggle { display: none; }
		@media (max-width: 56rem) {
			html, body { width: 100% !important; min-width: 0 !important; max-width: 100% !important; overflow-x: hidden !important; overflow-x: clip !important; }
			.app, .app__body, .app__main { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
			.app { overflow-x: hidden !important; overflow-x: clip !important; }
			.app__header {
				width: 100% !important;
				min-width: 0 !important;
				max-width: 100% !important;
				overflow: hidden !important;
				box-sizing: border-box;
			}
			.app__header > * { min-width: 0; }
			.app__contextTitle {
				flex: 1 1 0;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.app__header > .ms-auto { flex: 0 0 auto; min-width: 0; }
			.pim-admin-nav-toggle {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				flex: 0 0 3rem;
				width: 3rem;
				min-width: 3rem;
				height: 3rem;
				padding: 0 .75rem;
				border: 0;
				border-inline-end: 1px solid rgba(255,255,255,.2);
				background: transparent;
				color: #fff;
				font-weight: 700;
				cursor: pointer;
			}
			.pim-admin-nav-toggle:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }
			.app__body { display: block; width: 100%; }
			#app-nav {
				display: none !important;
				position: fixed !important;
				inset: 3rem 0 0 0 !important;
				z-index: 1200;
				width: 100% !important;
				height: calc(100dvh - 3rem) !important;
				max-height: none !important;
				background: #fff;
			}
			body.pim-admin-nav-open { overflow: hidden; }
			body.pim-admin-nav-open #app-nav { display: flex !important; }
			#app-nav > * { width: 100% !important; max-width: none !important; }
			#app-nav a { min-height: 44px; }
			.app__main { display: block; width: 100% !important; max-width: 100% !important; overflow-x: hidden; overflow-x: clip; }
			.app__page { width: 100%; min-width: 0; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
			.app__page > * { min-width: 0; max-width: 100%; }
			.app__page table {
				display: block;
				width: 100%;
				max-width: 100%;
				overflow-x: auto;
				-webkit-overflow-scrolling: touch;
			}
			.app__page .pkpSearch { min-width: 0; max-width: 100%; }
			.app__page .pkpSearch__input { width: 100%; max-width: 100%; box-sizing: border-box; }
			.app__page .flex.justify-between { flex-wrap: wrap; gap: .75rem; }
		}
	</style>
</head>
<body class="pkp_page_{$requestedPage|escape|default:"index"} pkp_op_{$requestedOp|escape|default:"index"}" dir="{$currentLocaleLangDir|escape|default:"ltr"}">

	<script type="text/javascript">
		// Initialise JS handler.
		$(function() {ldelim}
			$('body').pkpHandler(
				'$.pkp.controllers.SiteHandler',
				{ldelim}
					{include file="controllers/notification/notificationOptions.tpl"}
				{rdelim});
		{rdelim});
	</script>
	<div id="app" class="app" v-cloak>
		<pkp-spinner-full-screen></pkp-spinner-full-screen>
		<pkp-announcer class="sr-only"></pkp-announcer>
		<modal-manager></modal-manager>
		<header class="app__header" role="banner">
			<pkp-skip-link></pkp-skip-link>
			<button type="button" class="pim-admin-nav-toggle" id="pimAdminNavToggle" aria-controls="app-nav" aria-expanded="false">
				<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<path d="M4 6h16M4 12h16M4 18h16" />
				</svg>
				<span class="-screenReader">{translate key="common.navigation.site"}</span>
			</button>
			{if $availableContexts}
				<dropdown class="app__headerAction app__contexts">
					<template #button>
						<icon icon="Sitemap" class="h-7 w-7"></icon>
						<span class="-screenReader">{translate key="context.contexts"}</span>
					</template>
					<ul>
						{foreach from=$availableContexts item=$availableContext}
							{if !$currentContext || $availableContext->name !== $currentContext->getLocalizedData('name')}
								<li>
									<a href="{$availableContext->url|escape}" class="pkpDropdown__action">
										{$availableContext->name|escape}
									</a>
								</li>
							{/if}
						{/foreach}
					</ul>
				</dropdown>
			{/if}
			{if $currentContext}
				<a class="app__contextTitle" href="{url page="index"}">
					{$currentContext->getLocalizedData('name')|escape}
				</a>
			{elseif $siteTitle}
				<a class="app__contextTitle" href="{$baseUrl}">
					{$siteTitle|escape}
				</a>
			{else}
				<div class="app__contextTitle">
					{translate key="common.software"}
				</div>
			{/if}
			{if $currentUser}
				{call_hook name="Template::Layout::Backend::HeaderActions"}
				<top-nav-actions></top-nav-actions>
			{/if}
		</header>

		<div class="app__body">
			{block name="menu"}
				{if isset($currentContext) && isset($currentUser) && $currentUser->getRoles($currentContext->getId())|count > 0}
					<pkp-side-nav :links="menu" aria-label="{translate key="common.navigation.site"}">
					</pkp-side-nav>
				{/if}
			{/block}
			<main id="app-main" class="app__main">
				<div class="app__page width{if $pageWidth} width--{$pageWidth}{/if}">
					{block name="breadcrumbs"}
						{if $breadcrumbs}
							<nav class="app__breadcrumbs" role="navigation" aria-label="{translate key="navigation.breadcrumbLabel"}">
								<ol>
									{foreach from=$breadcrumbs item="breadcrumb" name="breadcrumbs"}
										{assign var=_format value=$breadcrumb.format|default:'text'|lower}

										{if $_format === 'text'}
											{assign var=_name value=$breadcrumb.name|escape}
										{else}
											{assign var=_name value=$breadcrumb.name|strip_unsafe_html}
										{/if}

										<li>
											{if $smarty.foreach.breadcrumbs.last}
												<span aria-current="page">
													{$_name}
												</span>
											{else}
												<a href="{$breadcrumb.url|escape}">
													{$_name}
												</a>
												<span class="app__breadcrumbsSeparator" aria-hidden="true">{translate key="navigation.breadcrumbSeparator"}</span>
											{/if}
										</li>
									{/foreach}
								</ol>
							</nav>
						{/if}
					{/block}

					{block name="page"}{/block}

				</div>
			</main>
		</div>
		<div
			aria-live="polite"
			aria-atomic="true"
			class="app__notifications"
			ref="notifications"
			role="status"
		>
			<transition-group name="app__notification">
				<notification v-for="notification in notifications" :key="notification.key" :type="notification.type" :can-dismiss="true" @dismiss="dismissNotification(notification.key)">
					{{ notification.message }}
				</notification>
			</transition-group>
		</div>
		<transition name="app__loading">
			<div
				v-if="isLoading"
				class="app__loading"
				role="alert"
			>
				<div class="app__loading__content">
					<spinner></spinner>
					{translate key="common.loading"}
				</div>
			</div>
		</transition>
	</div>

	<script type="text/javascript">
		pkp.registry.init('app', {$pageComponent|json_encode}, {$state|json_encode});
		(function () {
			var toggle = document.getElementById('pimAdminNavToggle');
			if (!toggle) return;
			var breakpoint = window.matchMedia('(max-width: 56rem)');
			function closeNav(restoreFocus) {
				document.body.classList.remove('pim-admin-nav-open');
				toggle.setAttribute('aria-expanded', 'false');
				if (restoreFocus) toggle.focus();
			}
			toggle.addEventListener('click', function () {
				var open = document.body.classList.toggle('pim-admin-nav-open');
				toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
				if (open) {
					var firstLink = document.querySelector('#app-nav a[href]');
					if (firstLink) window.requestAnimationFrame(function () { firstLink.focus(); });
				}
			});
			document.addEventListener('keydown', function (event) {
				if (event.key === 'Escape' && document.body.classList.contains('pim-admin-nav-open')) closeNav(true);
			});
			document.addEventListener('click', function (event) {
				if (breakpoint.matches && event.target.closest && event.target.closest('#app-nav a[href]')) closeNav(false);
			});
			breakpoint.addEventListener('change', function (event) {
				if (!event.matches) closeNav(false);
			});
		})();
	</script>
</body>
</html>
