{**
 * plugins/themes/pustakaMinang/templates/frontend/objects/galley_link.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Custom galley link template that supports site-wide context path overrides to prevent 404 links.
 *}

{* Override the $currentJournal context if desired *}
{if $journalOverride}
	{assign var="currentJournal" value=$journalOverride}
{/if}

{* Determine galley type and URL op *}
{if $galley->isPdfGalley()}
	{assign var="type" value="pdf"}
{/if}
{if !$type}
	{assign var="type" value="file"}
{/if}

{* Get path for URL *}
{if $parent instanceOf APP\issue\Issue}
	{assign var="page" value="issue"}
	{assign var="parentId" value=$parent->getBestIssueId()}
	{assign var="path" value=$parentId|to_array:$galley->getBestGalleyId()}
{else}{* APP\submission\Submission *}
	{assign var="page" value="article"}
	{if $publication}
		{if $publication->getId() !== $parent->getData('currentPublicationId')}
			{* Get a versioned link if we have an older publication *}
			{assign var="path" value=$parent->getBestId()|to_array:"version":$publication->getId():$galley->getBestGalleyId()}
		{else}
			{assign var="parentId" value=$publication->getData('urlPath')|default:$parent->getId()}
			{assign var="path" value=$parentId|to_array:$galley->getBestGalleyId()}
		{/if}
	{else}
		{assign var="path" value=$parent->getBestId()|to_array:$galley->getBestGalleyId()}
	{/if}
{/if}

{* Get user access flag *}
{if !$hasAccess}
	{if $restrictOnlyPdf && $type=="pdf"}
		{assign var=restricted value="1"}
	{elseif !$restrictOnlyPdf}
		{assign var=restricted value="1"}
	{/if}
{/if}

{* Construct correct URL with context override if available *}
{if $currentJournal}
	{assign var="galleyUrl" value={url journal=$currentJournal->getPath() page=$page op="view" path=$path}}
{else}
	{assign var="galleyUrl" value={url page=$page op="view" path=$path}}
{/if}

<a class="{if $isSupplementary}obj_galley_link_supplementary{else}obj_galley_link{/if} {$type|escape}{if $restricted} restricted{/if}" href="{$galleyUrl}"{if $id} id="{$id}"{/if}{if $labelledBy} aria-labelledby="{$labelledBy}"{/if}>
	{* Add some screen reader text to indicate if a galley is restricted *}
	{if $restricted}
		<span class="pkp_screen_reader">
			{if $purchaseArticleEnabled}
				{translate key="reader.subscriptionOrFeeAccess"}
			{else}
				{translate key="reader.subscriptionAccess"}
			{/if}
		</span>
	{/if}

	{$galley->getGalleyLabel()|escape}

	{if $restricted && $purchaseFee && $purchaseCurrency}
		<span class="purchase_cost">
			{translate key="reader.purchasePrice" price=$purchaseFee currency=$purchaseCurrency}
		</span>
	{/if}
</a>
