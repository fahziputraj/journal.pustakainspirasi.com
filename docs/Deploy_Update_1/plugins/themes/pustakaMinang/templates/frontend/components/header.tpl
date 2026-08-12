{**
 * plugins/themes/pustakaMinang/templates/frontend/components/header.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Custom frontend site header with logo on left, Submit Manuscript on right.
 *}
{strip}
	{assign var="showingLogo" value=true}
	{if !$displayPageHeaderLogo}
		{assign var="showingLogo" value=false}
	{/if}
	{assign var="gpPublicJournalLayout" value=false}
	{if $currentContext && $requestedPage != 'user' && $requestedPage != 'login' && $requestedPage != 'management' && $requestedPage != 'dashboard' && $requestedPage != 'admin'}
		{assign var="gpPublicJournalLayout" value=true}
	{/if}
	{assign var="gpAccountLayout" value=false}
	{if !$gpPublicJournalLayout && ($requestedPage == 'user' || $requestedPage == 'login')}
		{assign var="gpAccountLayout" value=true}
	{/if}
{/strip}
<!DOCTYPE html>
<html lang="{$currentLocale|replace:"_":"-"}" xml:lang="{$currentLocale|replace:"_":"-"}">
{if !$pageTitleTranslated}{capture assign="pageTitleTranslated"}{translate key=$pageTitle}{/capture}{/if}
{include file="frontend/components/headerHead.tpl"}

<!-- Load Layout & FontAwesome Overrides -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<body class="pkp_page_{$requestedPage|escape|default:"index"} pkp_op_{$requestedOp|escape|default:"index"}{if $gpPublicJournalLayout} pim_public_journal{elseif $gpAccountLayout} pim_account_page{/if}">

<div class="pkp_structure_page">

<!-- Top Bar -->
<div class="pim-topbar">
  <div class="pim-container">
    <div class="pim-topbar-left">
      <a href="https://journal.pustakainspirasi.com"><i class="fas fa-globe"></i> PIM Portal</a>
    </div>
    <div class="pim-topbar-right">
      <a href="mailto:admin@pustakainspirasi.com"><i class="fas fa-envelope"></i> Contact Support</a>
    </div>
  </div>
</div>

<!-- Main Header -->
<header class="pim-header" id="mainHeader">
  <div class="pim-container">
    <a class="pim-brand" href="{$baseUrl}/">
      {if $displayPageHeaderLogo}
        <img src="{$publicFilesDir}/{$displayPageHeaderLogo.uploadName|escape:"url"}" alt="{if $currentContext}{$currentContext->getLocalizedName()|escape}{else}{$siteTitle|escape|default:"PIM Portal"}{/if}">
      {else}
        <img src="{$baseUrl}/logo.png" alt="PIM Journal Logo">
      {/if}
    </a>

    {if !$currentContext}
      <nav class="pim-nav" id="mainNav">
        <a href="{$baseUrl}/">Home</a>
        <a href="{url page="index"}" class="{if $requestedPage == 'index' || $requestedPage == ''}active{/if}">Our Journals</a>
        <a href="{url page="about"}">About PIM</a>
      </nav>
    {/if}

    <div class="pim-header-actions">
      {if $isUserLoggedIn || $loggedInUser}
        <div class="pim-user-topbar pim-user-menu-ojs">
          {load_menu name="user" id="navigationUser" ulClass="pkp_navigation_user pim-user-list"}
        </div>
      {else}
        <a href="{url router=$smarty.const.ROUTE_PAGE page="login"}" class="btn-login"><i class="fas fa-sign-in-alt"></i> Login</a>
        <a href="{url router=$smarty.const.ROUTE_PAGE page="user" op="register"}" class="btn-publish"><i class="fas fa-paper-plane"></i> Submit Manuscript</a>
      {/if}
      {if !$currentContext}
        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      {/if}
    </div>
  </div>
</header>

{if $gpPublicJournalLayout}
  <div class="pim-mobile-tools-backdrop" data-pim-tools-close aria-hidden="true"></div>
  <div class="pim-mobile-tools-bar" aria-label="Mobile journal tools">
    <button type="button" class="pim-mobile-tools-toggle" id="pimMobileToolsToggle" aria-expanded="false">
      <i class="fas fa-sliders"></i> Journal Tools
    </button>
    <div class="pim-mobile-tools-tabs" role="tablist" aria-label="Journal mobile panels">
      <button type="button" class="is-active" data-pim-tools-tab="menu">Menu</button>
      <button type="button" data-pim-tools-tab="links">Links</button>
    </div>
  </div>
{/if}

{if $currentContext || $gpAccountLayout}
  <div class="pkp_structure_content{if $gpPublicJournalLayout} pkp_has_sidebar pim-layout-journal-public{elseif $gpAccountLayout} pim-account-layout{/if}">
  {if $gpPublicJournalLayout}
    <aside class="pim-journal-tools" aria-label="Journal tools">
      <div class="pim-journal-tools-panel">
        <div class="pim-journal-tools-head">
          <span>Journal Menu</span>
          <strong>{$currentContext->getLocalizedName()|escape}</strong>
        </div>

        <div class="pim-journal-tools-group">
          <h2>Content</h2>
          <a href="{$baseUrl}/index.php/index"><i class="fas fa-layer-group"></i> All Journals</a>
          <a href="{url page="index"}" class="{if $requestedPage == 'index'}is-active{/if}"><i class="fas fa-house"></i> Home / Overview</a>
          <a href="{url page="search"}" class="{if $requestedPage == 'search'}is-active{/if}"><i class="fas fa-magnifying-glass"></i> Search</a>
          <a href="{url page="announcement"}" class="{if $requestedPage == 'announcement'}is-active{/if}"><i class="fas fa-bullhorn"></i> Announcements</a>
        </div>

        <div class="pim-journal-tools-group">
          <h2>Journal Issues</h2>
          <a href="{url page="issue" op="current"}" class="{if $requestedPage == 'issue' && $requestedOp == 'current'}is-active{/if}"><i class="fas fa-file-lines"></i> Current Issue</a>
          <a href="{url page="issue" op="archive"}" class="{if $requestedPage == 'issue' && $requestedOp == 'archive'}is-active{/if}"><i class="fas fa-box-archive"></i> Archives</a>
        </div>

        <div class="pim-journal-tools-group">
          <h2>Guidelines</h2>
          <a href="{url page="about" op="submissions"}"><i class="fas fa-pen-to-square"></i> Author Guidelines</a>
          <a href="{url page="about" op="editorialTeam"}"><i class="fas fa-users"></i> Editorial Team</a>
        </div>

        <div class="pim-journal-tools-group">
          <h2>About</h2>
          <a href="{url page="about"}" class="{if $requestedPage == 'about' && !$requestedOp}is-active{/if}"><i class="fas fa-circle-info"></i> About</a>
          <a href="{url page="about" op="contact"}"><i class="fas fa-envelope"></i> Contact</a>
        </div>

        <a class="pim-journal-submit" href="{url page="about" op="submissions"}"><i class="fas fa-paper-plane"></i> Make a Submission</a>
      </div>
    </aside>
  {/if}
{else}
  <div class="pkp_structure_content">
{/if}
    <div class="pkp_structure_main" role="main">
