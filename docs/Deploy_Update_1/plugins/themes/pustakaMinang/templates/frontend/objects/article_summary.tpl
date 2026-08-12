{**
 * plugins/themes/pustakaMinang/templates/frontend/objects/article_summary.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Custom article summary template that displays premium card details.
 *}
{assign var=publication value=$article->getCurrentPublication()}
{assign var=articlePath value=$publication->getData('urlPath')|default:$article->getId()}
{if !$heading}
	{assign var="heading" value="h2"}
{/if}

{if (!$section.hideAuthor && $publication->getData('hideAuthor') == APP\submission\Submission::AUTHOR_TOC_DEFAULT) || $publication->getData('hideAuthor') == APP\submission\Submission::AUTHOR_TOC_SHOW}
	{assign var="showAuthor" value=true}
{/if}

<div class="obj_article_summary pim-article-card">
	
	<{$heading} class="title pim-article-title">
		<a id="article-{$article->getId()}" {if $journal}href="{url journal=$journal->getPath() page="article" op="view" path=$articlePath}"{else}href="{url page="article" op="view" path=$articlePath}"{/if}>
			{if $currentContext}
				{$publication->getLocalizedTitle(null, 'html')|strip_unsafe_html}
				{assign var=localizedSubtitle value=$publication->getLocalizedSubtitle(null, 'html')|strip_unsafe_html}
				{if $localizedSubtitle}
					<span class="subtitle">{$localizedSubtitle}</span>
				{/if}
			{else}
				{$publication->getLocalizedFullTitle(null, 'html')|strip_unsafe_html}
				<span class="subtitle">
					{$journal->getLocalizedName()|escape}
				</span>
			{/if}
		</a>
	</{$heading}>

	{if $showAuthor}
		<div class="authors pim-article-authors">
			{$publication->getAuthorString($authorUserGroups)|escape}
		</div>
	{/if}

	{* Badges Row: Pages, DOI, Published *}
	<div class="pim-article-tags-row">
		{assign var=submissionPages value=$publication->getData('pages')}
		{if $submissionPages}
			<span class="pim-article-tag pim-tag-pages">
				<span class="tag-label">PAGES</span>
				<span class="tag-val">{$submissionPages|escape}</span>
			</span>
		{/if}

		{assign var=doiObject value=$publication->getData('doiObject')}
		{if $doiObject}
			{assign var="doiUrl" value=$doiObject->getData('resolvingUrl')|escape}
			{assign var="doiString" value=$doiObject->getData('doi')|escape}
			<span class="pim-article-tag pim-tag-doi">
				<span class="tag-label">DOI</span>
				<span class="tag-val"><a href="{$doiUrl}" target="_blank" rel="noopener">{$doiString}</a></span>
			</span>
		{/if}

		{assign var=submissionDatePublished value=$publication->getData('datePublished')}
		{if $submissionDatePublished}
			<span class="pim-article-tag pim-tag-published">
				<span class="tag-label">PUBLISHED</span>
				<span class="tag-val">{$submissionDatePublished|date_format:($dateFormatShort|replace:"%":"")}</span>
			</span>
		{/if}
	</div>

	{* Abstract Excerpt *}
	{if $publication->getLocalizedData('abstract')}
		<div class="pim-article-excerpt">
			{$publication->getLocalizedData('abstract')|strip_unsafe_html|strip_tags|truncate:240:"..."}
		</div>
	{/if}

	{* Footer Row: PDF Button + Stats Counters *}
	<div class="pim-article-footer">
		<div class="pim-article-galleys">
			{if !$hideGalleys}
				<ul class="galleys_links" style="list-style:none; padding:0; margin:0; display:flex; gap:8px;">
					{foreach from=$publication->getData('galleys') item=galley}
						{if $primaryGenreIds}
							{assign var="file" value=$galley->getFile()}
							{if !$galley->getData('urlRemote') && !($file && in_array($file->getGenreId(), $primaryGenreIds))}
								{continue}
							{/if}
						{/if}
						<li>
							{assign var="hasArticleAccess" value=$hasAccess}
							{if $currentContext && ($currentContext->getSetting('publishingMode') == APP\journal\Journal::PUBLISHING_MODE_OPEN || $publication->getData('accessStatus') == APP\submission\Submission::ARTICLE_ACCESS_OPEN)}
								{assign var="hasArticleAccess" value=1}
							{/if}
							{assign var="id" value="article-{$article->getId()}-galley-{$galley->getId()}"}
							{include file="frontend/objects/galley_link.tpl" parent=$article publication=$publication id=$id labelledBy="{$id} article-{$article->getId()}" hasAccess=$hasArticleAccess purchaseFee=$currentJournal->getData('purchaseArticleFee') purchaseCurrency=$currentJournal->getData('currency') journalOverride=$journal}
						</li>
					{/foreach}
				</ul>
			{/if}
		</div>

		<div class="pim-article-stats">
			{assign var="views" value=$article->getId()|pim_article_views}
			{assign var="downloads" value=$article->getId()|pim_article_downloads}
			<span class="pim-stat-item pim-stat-views" title="Abstract Views">
				<i class="fa-solid fa-chart-simple"></i>
				<span class="stat-count">{$views}</span> views
			</span>
			<span class="pim-stat-item pim-stat-downloads" title="Galley Downloads">
				<i class="fa-solid fa-file-arrow-down"></i>
				<span class="stat-count">{$downloads}</span> downloads
			</span>
		</div>
	</div>
</div>
