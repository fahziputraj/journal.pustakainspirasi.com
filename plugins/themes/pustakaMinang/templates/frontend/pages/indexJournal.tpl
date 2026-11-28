{**
 * templates/frontend/pages/indexJournal.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Display the index page for a journal
 *
 * @uses $currentJournal Journal This journal
 * @uses $journalDescription string Journal description from HTML text editor
 * @uses $homepageImage object Image to be displayed on the homepage
 * @uses $additionalHomeContent string Arbitrary input from HTML text editor
 * @uses $announcements array List of announcements
 * @uses $numAnnouncementsHomepage int Number of announcements to display on the
 *       homepage
 * @uses $issue Issue Current issue
 *}
{include file="frontend/components/header.tpl" pageTitleTranslated=$currentJournal->getLocalizedName()}
{* pim-fallback-cover:start  An issue without its own cover shows the journal's homepage image
   (its cover), not the generic default image. *}
{assign var="pimJournalCover" value=$currentJournal->getLocalizedData('homepageImage')}
{capture assign="pimFallbackCover"}{if $pimJournalCover && $pimJournalCover.uploadName}{$publicFilesDir}/{$pimJournalCover.uploadName|escape:"url"}{else}{$baseUrl}/default_journal_issue_cover.png{/if}{/capture}
{* pim-fallback-cover:end *}

<div class="page_index_journal">
	{call_hook name="Templates::Index::journal"}

	{* Journal Cover Image + About Section - always at the top. Prefer Homepage Image; fall back to Journal Thumbnail. *}
	{assign var=pimHomepageImage value=$homepageImage}
	{if !$pimHomepageImage}
		{assign var=pimJournalThumbnail value=$currentContext->getLocalizedData('journalThumbnail')}
		{if $pimJournalThumbnail}
			{assign var=pimHomepageImage value=$pimJournalThumbnail}
		{/if}
	{/if}
	{if !$activeTheme->getOption('useHomepageImageAsHeader') && $pimHomepageImage}
		{assign var=pimHasHomepageImage value=true}
	{else}
		{assign var=pimHasHomepageImage value=false}
	{/if}

	{* Journal Description + Cover Image — top hero section *}
	{if $currentContext->getLocalizedData('description') || $pimHasHomepageImage}
		<div class="additional_content homepage_about" {if $pimHasHomepageImage}data-gp-has-official-image="true"{/if}>
			<div class="pim-journal-hero-text">
				<h1 class="pim-journal-title">{$currentJournal->getLocalizedName()|escape}</h1>
				{if $currentContext->getLocalizedData('description')}
					<a id="homepageAbout"></a>
					<div class="gp-journal-description">
						{$currentContext->getLocalizedData('description')}
					</div>
				{/if}
			</div>
			{if $pimHasHomepageImage}
				<div class="homepage_image" data-gp-official-home-image="true">
					<img src="{$publicFilesDir}/{$pimHomepageImage.uploadName|escape:"url"}" alt="{$pimHomepageImage.altText|default:$currentJournal->getLocalizedName()|escape}" width="132" height="188" loading="eager" decoding="async" fetchpriority="high">
				</div>
			{/if}
		</div>
	{else}
		<h1 class="pim-journal-title">{$currentJournal->getLocalizedName()|escape}</h1>
	{/if}

	{* Additional Home Content (Table, Recommended tools, etc.) — full width section *}
	{if $additionalHomeContent}
		<div class="pim-additional-home-content-wrapper">
			<div class="pim-additional-home-content">
				{$additionalHomeContent}
			</div>
		</div>
	{/if}

	{* Sidebar widgets (About, Citation Analysis, etc.) — extracted by JS, placed here BEFORE Current Issue *}
	<div id="pim-extracted-widgets-container"></div>

	{* Announcements *}
	{if $numAnnouncementsHomepage && !empty($announcements)}
		<section class="cmp_announcements highlight_first gp-home-announcements-simple">
			<a id="homepageAnnouncements"></a>
			<h2>
				{translate key="announcement.announcements"}
			</h2>
			{foreach name=announcements from=$announcements item=announcement}
				{if $smarty.foreach.announcements.iteration > $numAnnouncementsHomepage}
					{break}
				{/if}
				{if $smarty.foreach.announcements.iteration == 1}
					{include file="frontend/objects/announcement_summary.tpl" heading="h3"}
					<div class="more">
				{else}
					<article class="obj_announcement_summary">
						<h4>
							<a href="{url router=$smarty.const.ROUTE_PAGE page="announcement" op="view" path=$announcement->id}">
								{$announcement->getLocalizedData('title')|escape}
							</a>
						</h4>
						<div class="date">
							{$announcement->datePosted->format($dateFormatShort)}
						</div>
						<div class="summary">
							{if $announcement->getLocalizedData('descriptionShort')}
								<div class="announcement_excerpt">{$announcement->getLocalizedData('descriptionShort')|strip_unsafe_html}</div>
							{/if}
							<a href="{url router=$smarty.const.ROUTE_PAGE page="announcement" op="view" path=$announcement->id}" class="read_more">
								{translate key="common.readMore"}
							</a>
						</div>
					</article>
				{/if}
			{/foreach}
			{if !empty($smarty.foreach.announcements.iteration)}
				</div><!-- .more -->
			{/if}
		</section>
	{/if}

	{* Current Issue + Latest Articles *}
	{if $issue}
		{assign var=issueDoi value=""}
		{assign var=issueDoiUrl value=""}
		{foreach from=$pubIdPlugins item=pubIdPlugin}
			{if $pubIdPlugin->getPubIdType() == 'doi'}
				{assign var=issueDoi value=$issue->getStoredPubId($pubIdPlugin->getPubIdType())}
				{if $issueDoi}
					{assign var=issueDoiUrl value=$pubIdPlugin->getResolvingURL($currentJournal->getId(), $issueDoi)}
				{/if}
			{/if}
		{/foreach}
		<section class="current_issue pim-home-current-issue">
			<a id="homepageIssue"></a>
			<h2>{translate key="journal.currentIssue"}</h2>
			
			<div class="pim-home-current-issue-card">
				<div class="pim-home-current-cover">
					{assign var=issueCover value=$issue->getLocalizedCoverImageUrl()}
					<a href="{url op="view" page="issue" path=$issue->getBestIssueId()}">
						{if $issueCover}
							<img src="{$issueCover|escape}" alt="{$issue->getLocalizedCoverImageAltText()|escape}" loading="lazy" decoding="async">
						{else}
							<img src="{$pimFallbackCover|escape}" alt="{$currentJournal->getLocalizedName()|escape}" loading="lazy" decoding="async">
						{/if}
					</a>
				</div>
				<div class="pim-home-current-body">
					<h3>
						<a href="{url op="view" page="issue" path=$issue->getBestIssueId()}">
							{if $issue->getLocalizedTitle()}
								{$issue->getLocalizedTitle()|escape}
							{else}
								{$issue->getIssueSeries()|escape}
							{/if}
						</a>
					</h3>
					{if $issue->getLocalizedTitle() && $issue->getIssueSeries()}
						<div class="pim-home-current-series">
							{$issue->getIssueSeries()|escape}
						</div>
					{/if}
					{if $issue->getLocalizedDescription()}
						<div class="pim-home-current-description">
							{$issue->getLocalizedDescription()|strip_unsafe_html|strip_tags|truncate:240:"..."}
						</div>
					{/if}
					<div class="pim-home-current-meta">
						{if $issue->getLocalizedTitle() && $issue->getIssueSeries()}
							<span><strong>Issue</strong> {$issue->getIssueSeries()|escape}</span>
						{/if}
						{if $issueDoi}
							<span><strong>DOI</strong> {if $issueDoiUrl}<a href="{$issueDoiUrl|escape}">{$issueDoi|escape}</a>{else}{$issueDoi|escape}{/if}</span>
						{/if}
						{if $issue->getDatePublished()}
							<span><strong>Published</strong> {$issue->getDatePublished()|date_format:($dateFormatShort|replace:"%":"")}</span>
						{/if}
					</div>
					<a class="pim-home-current-link" href="{url op="view" page="issue" path=$issue->getBestIssueId()}">View Issue</a>
				</div>
			</div>

			{* Articles from Current Issue *}
			{if !empty($publishedSubmissions)}
				<div class="pim-homepage-articles" style="margin-top: 32px;">
					<h3 style="margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; color: #1e293b; padding-bottom: 10px; border-bottom: 2px solid var(--pim2-accent, #A91D22); display: inline-block;">
						<i class="fas fa-file-alt" style="margin-right: 6px; color: var(--pim2-accent, #A91D22);"></i>Latest Articles
					</h3>
					{foreach from=$publishedSubmissions item=section}
						{if $section.articles}
							{if $section.title}
								<h4 style="margin: 18px 0 10px; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;">{$section.title|escape}</h4>
							{/if}
							<ul class="cmp_article_list articles" style="list-style: none; padding: 0; margin: 0;">
								{foreach from=$section.articles item=article}
									<li>
										{include file="frontend/objects/article_summary.tpl" heading="h4"}
									</li>
								{/foreach}
							</ul>
						{/if}
					{/foreach}
				</div>
			{/if}
		</section>
	{/if}


	{* Past issues: rendered by pim-ui.js (window.PIM.renderPastIssues) only when the archive has more than the current issue *}
	<section class="pim-past-issues" id="pim-popular-issues-container" data-pim-past-issues data-archive-url="{url router=$smarty.const.ROUTE_PAGE page="issue" op="archive"}" data-fallback-cover="{$pimFallbackCover|escape}" hidden>
		<h2>Past Issues</h2>
		<div class="pim-issues-grid"></div>
	</section>

</div><!-- .page -->

{include file="frontend/components/footer.tpl"}
