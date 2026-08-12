{**
 * templates/frontend/pages/indexSite.tpl
 * Overhauled PIM premium journal directory with spacious 2-column layout.
 *}
{include file="frontend/components/header.tpl"}



<section class="jl-home-shell">
  <!-- Hidden search element for JS filter compatibility -->
  <input type="hidden" id="journalSearch" value="">



  <div class="pim-portal-layout" id="journalDirectory">
    
    <!-- Left Column: Search Journal list & Filters -->
    <div class="pim-sidebar-drawer-bg" data-jl-tools-close></div>
    <aside class="pim-portal-left-col" id="sidebarDrawer" aria-label="Journal directory and filter tools">
      <div class="pim-sidebar-drawer-header">
        <h3>Filter & Tools</h3>
        <button type="button" class="pim-sidebar-drawer-close" data-jl-tools-close aria-label="Close filters">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Browse Journals scrolling directory list -->
      <div class="pim-sidebar-card">
        <h3>Browse Journals</h3>
        <div class="pim-sidebar-search-wrap" style="position:relative; margin-bottom:12px;">
          <input type="text" id="journalFinder" placeholder="Find journal..." autocomplete="off" style="width:100%; padding:8px 8px 8px 32px; border:1px solid #E2E8F0; border-radius:6px; font-size:12px; font-family:var(--pim-font-sans);">
          <i class="fas fa-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94A3B8; font-size:12px;"></i>
        </div>
        <div class="pim-sidebar-journal-scroller" style="max-height: 240px; overflow-y: auto; border: 1px solid #F1F5F9; border-radius: 6px; padding: 6px; display: flex; flex-direction: column; gap: 4px; background:#FAFAFA;">
          {foreach from=$journals item=journal}
            {assign var="thumb" value=$journal->getLocalizedData('journalThumbnail')}
            {assign var="journalName" value=$journal->getLocalizedName()}
            <a href="{url journal=$journal->getPath()}" class="pim-sidebar-journal-link" data-sidebar-journal-id="{$journal->getId()}" style="display:flex; align-items:center; gap:8px; padding:6px; border-radius:4px; text-decoration:none; color:#334155; font-size:11.5px; font-weight:600; transition:all 0.15s ease;">
              <span style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; background:transparent;">
                {if $thumb}
                  <img src="{$journalFilesPath}{$journal->getId()}/{$thumb.uploadName|escape:"url"}" alt="{$journalName|escape}" style="max-width:100%; max-height:100%; object-fit:contain;">
                {else}
                  <i class="fas fa-book-open" style="font-size:10px; color:#94A3B8;"></i>
                {/if}
              </span>
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{$journalName}</span>
            </a>
          {/foreach}
        </div>
      </div>

      <!-- Browse by Subject -->
      <div class="pim-sidebar-card" style="margin-top:14px;">
        <h3>Browse by Subject</h3>
        <div class="pim-sidebar-list" id="subjectFilters">
          <button type="button" class="pim-sidebar-btn" data-subject="health">Medicine &amp; Life Sciences <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-subject="education">Education &amp; Social Sciences <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-subject="technology">Engineering &amp; Physical Sciences <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-subject="humanities">Law, Policy &amp; Humanities <span class="count">0</span></button>
        </div>
      </div>

      <!-- Browse by Indexing -->
      <div class="pim-sidebar-card" style="margin-top:14px;">
        <h3>Accreditation &amp; Indexing</h3>
        <div class="pim-sidebar-list" id="indexingFilters">
          <button type="button" class="pim-sidebar-btn" data-indexing="sinta">SINTA Accredited <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-indexing="doaj">DOAJ Indexed <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-indexing="google scholar">Google Scholar <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-indexing="garuda">Garuda <span class="count">0</span></button>
          <button type="button" class="pim-sidebar-btn" data-indexing="crossref">Crossref Member <span class="count">0</span></button>
        </div>
      </div>

      <!-- Reset and Active Filters -->
      <div class="pim-sidebar-card" style="margin-top:14px;">
        <h3>Active Filters</h3>
        <div class="jl-active-filters" id="activeFilters" data-active-filters style="margin-bottom:12px;"></div>
        <p class="pim-toolbar-summary" id="toolbarSummary" data-toolbar-summary style="margin-bottom:16px;">All journals are visible.</p>
        <button type="button" class="pim-sidebar-reset-btn" id="resetFilters"><i class="fas fa-rotate-left"></i> Reset all filters</button>
      </div>

    </aside>

    <!-- Center Column: Main Portal Area -->
    <main class="pim-portal-mid-col" style="display:flex; flex-direction:column; gap:16px; min-width:0;">
      
      <!-- Main Toolbar (Results count and sort) -->
      <div class="pim-main-toolbar" id="directoryResultsHeader">
        <div class="pim-main-toolbar-left">
          <h2 class="pim-toolbar-title">Journal Directory</h2>
          <span class="pim-toolbar-summary" id="resultSummary">{if !empty($journals)}{$journals|@count}{else}0{/if} journals found</span>
        </div>
        <div class="pim-main-toolbar-right">
          <!-- Mobile Toggle Buttons -->
          <button type="button" class="pim-mobile-filter-toggle" id="jlMobileToolsToggle">
            <i class="fas fa-sliders-h"></i> Filters
          </button>
          <span class="pim-sort-label">Sort:</span>
          <div class="pim-sort-btn-group">
            <button type="button" class="pim-sort-btn is-active" data-sort="az">A-Z</button>
            <button type="button" class="pim-sort-btn" data-sort="za">Z-A</button>
          </div>
        </div>
      </div>

      <!-- Journal Cards Grid -->
      <section class="jl-list-section">
        <div class="pim-journals-grid jl-list" id="journalList">
          {if empty($journals)}
            <div class="pim-empty-results"><i class="fas fa-inbox"></i><p>No journals available yet.</p></div>
          {else}
            {foreach from=$journals item=journal}
              {capture assign="journalUrl"}{url journal=$journal->getPath()}{/capture}
              {assign var="thumb" value=$journal->getLocalizedData('journalThumbnail')}
              {assign var="journalName" value=$journal->getLocalizedName()}
              {assign var="journalDescription" value=$journal->getLocalizedDescription()|strip_tags}
              {assign var="journalAbout" value=$journal->getLocalizedData('about')}
              {assign var="journalHome" value=$journal->getLocalizedData('additionalHomeContent')}
              {capture assign="journalSearchData"}{$journalDescription} {$journalAbout} {$journalHome}{/capture}
              {assign var="onlineIssn" value=$journal->getData('onlineIssn')}
              {assign var="printIssn" value=$journal->getData('printIssn')}
              
              <!-- Individual Journal Card -->
              <div class="pim-journal-card jl-item" data-journal-id="{$journal->getId()|escape}" data-name="{$journalName|escape}" data-desc="{$journalSearchData|escape}" data-short-desc="{$journalDescription|escape}">
                
                <div class="pim-card-header">
                  <!-- Thumbnail/Logo -->
                  <div class="pim-card-thumb">
                    {if $thumb}
                      <img src="{$journalFilesPath}{$journal->getId()}/{$thumb.uploadName|escape:"url"}" alt="{$journalName|escape}" loading="lazy" decoding="async">
                    {else}
                      <div class="pim-card-thumb-placeholder"><i class="fas fa-book-open"></i></div>
                    {/if}
                  </div>
                  
                  <!-- Title & Badges -->
                  <div class="pim-card-title-group">
                    <div class="pim-card-badges">
                      <span class="pim-badge pim-badge-oa"><i class="fas fa-lock-open"></i> Open Access</span>
                      <span class="pim-badge pim-badge-pr"><i class="fas fa-check-circle"></i> Peer Reviewed</span>
                    </div>
                    <h3 class="pim-journal-title"><a href="{$journalUrl}">{$journalName}</a></h3>
                    {if $onlineIssn || $printIssn}
                      <div class="pim-journal-issn">
                        {if $onlineIssn}<span>e-ISSN: {$onlineIssn|escape}</span>{/if}
                        {if $printIssn}<span>p-ISSN: {$printIssn|escape}</span>{/if}
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Card Body (Description) -->
                <div class="pim-card-body">
                  {if $journalDescription}
                    <p class="pim-journal-desc">{$journalDescription|truncate:180}</p>
                  {/if}
                </div>

                <!-- Card Actions -->
                <div class="pim-card-actions">
                  <a href="{$journalUrl}" class="pim-view-link">Explore Portal <i class="fas fa-arrow-right"></i></a>
                  <a href="{url journal=$journal->getPath() page="about" op="submissions"}" class="pim-btn-submit"><i class="fas fa-upload"></i> Submit manuscript</a>
                </div>

              </div>
            {/foreach}
          {/if}
        </div>

        <div class="pim-empty-results" id="noResults" style="display:none;">
          <i class="fas fa-search"></i>
          <p>No journals match the active filters.</p>
        </div>
      </section>

      <!-- Center Featured Articles Section -->
      <section class="pim-articles-section" aria-label="Featured publications">
        <div class="jl-insight-card">
          <h2>Featured Articles</h2>
          <div class="jl-mini-list" id="jlFeaturedArticles">
            <p class="jl-control-note">Loading published articles from active OJS issues...</p>
          </div>
        </div>
      </section>

    </main>

    <!-- Right Column: Latest Issues & News -->
    <aside class="pim-portal-right-col" aria-label="Latest issues and announcements" style="display:flex; flex-direction:column; gap:16px; width:320px; flex-shrink:0;">
      
      <!-- Latest Issues covers -->
      <div class="pim-sidebar-card">
        <h3>Latest Issues</h3>
        <div class="jl-issue-chip-row" id="jlPopularIssues">
          <span class="jl-control-note">Finding published issues...</span>
        </div>
      </div>

      <!-- News & Announcements -->
      {if !empty($announcements)}
        <div class="pim-sidebar-card">
          <h3>Portal News</h3>
          <div class="pim-sidebar-news-list" style="display:flex; flex-direction:column; gap:12px;">
            {foreach name=announcements from=$announcements item=announcement}
              {if $smarty.foreach.announcements.iteration > 3}{break}{/if}
              <div class="pim-sidebar-news-item" style="border-bottom:1px solid #F1F5F9; padding-bottom:8px; display:flex; flex-direction:column; gap:4px;">
                <h4 style="font-size:12.5px; font-weight:700; color:#1E2022; margin:0; line-height:1.35;">
                  <a href="{url page="announcement" op="view" path=$announcement->id}" style="color:inherit; text-decoration:none; transition:color 0.15s ease;">{$announcement->getLocalizedData('title')|escape}</a>
                </h4>
                <span style="font-size:10.5px; color:#64748B; font-weight:500;">{$announcement->datePosted->format($dateFormatShort)}</span>
              </div>
            {/foreach}
          </div>
        </div>
      {/if}

    </aside>

  </div>
</section>
{literal}
<script>
document.addEventListener('DOMContentLoaded', function() {
  const items = document.querySelectorAll('.jl-item');
  const grid = document.querySelector('.pim-popular-journals-grid');
  if (!grid || items.length === 0) return;
  
  for(let i = 0; i < Math.min(4, items.length); i++) {
    const item = items[i];
    const clone = document.createElement('div');
    clone.className = 'jl-panel pim-popular-journal-card';
    
    // Extract nodes
    const thumbNode = item.querySelector('.pim-card-thumb');
    const titleNode = item.querySelector('.pim-journal-title');
    const descNode = item.querySelector('.pim-journal-desc');
    
    // Process Thumbnail
    let thumbHtml = '';
    if (thumbNode) {
      const img = thumbNode.querySelector('img');
      if (img) {
        thumbHtml = `<img class="pim-popular-journal-cover" src="${img.src}" alt="${img.alt}" loading="lazy" decoding="async">`;
      } else {
        thumbHtml = `<div class="pim-popular-journal-cover pim-popular-journal-cover-empty"><i class="fas fa-book"></i></div>`;
      }
    }
    
    // Process Title & Link
    const titleLink = titleNode ? titleNode.querySelector('a') : null;
    const titleText = titleLink ? titleLink.textContent : '';
    const href = titleLink ? titleLink.href : '#';
    
    // Process Description
    const descHtml = descNode ? descNode.innerHTML : '';
    
    clone.innerHTML = `
      ${thumbHtml}
      <h3>
        <a href="${href}">${titleText}</a>
      </h3>
      <p>
        ${descHtml}
      </p>
      <div class="pim-popular-journal-actions">
        <a href="${href}" class="jl-btn jl-btn-primary">Visit Journal</a>
        <a href="${href}/about/submissions" class="jl-btn jl-btn-outline"><i class="fas fa-upload"></i></a>
      </div>
    `;

    grid.appendChild(clone);
  }
});
</script>
{/literal}

{literal}
<script>
document.addEventListener('DOMContentLoaded', function() {
  const journalItems = Array.from(document.querySelectorAll('.jl-item'));
  const featured = document.getElementById('jlFeaturedArticles');
  const issues = document.getElementById('jlPopularIssues');
  const sidebarIssues = document.getElementById('jlSidebarPopularIssues');
  if (!featured || !issues || !journalItems.length) return;

  const parser = new DOMParser();
  const maxJournals = 4;
  const baseRecords = journalItems.slice(0, maxJournals).map((item) => {
    const link = item.querySelector('.pim-journal-title a');
    const cover = item.querySelector('.pim-card-thumb img');
    return {
      title: link ? link.textContent.trim() : '',
      url: link ? link.href.replace(/\/$/, '') : '',
      cover: cover ? cover.src : ''
    };
  }).filter((record) => record.url);

  function renderFallbackRecords() {
    const fallback = baseRecords.slice(0, 4);
    if (!fallback.length) return;
    featured.innerHTML = fallback.slice(0, 3).map((record) => `
      <a class="jl-dynamic-article is-fallback" href="${record.url}">
        ${record.cover ? `<img src="${record.cover}" alt="${record.title} cover" loading="lazy" decoding="async">` : ''}
        <span>
          <strong>${record.title}</strong>
          <em>Open journal overview and publications</em>
        </span>
      </a>
    `).join('');
    issues.innerHTML = fallback.map((record) => `
      <a class="jl-dynamic-issue is-fallback" href="${record.url}/issue/archive">
        ${record.cover ? `<img src="${record.cover}" alt="${record.title} cover" loading="lazy" decoding="async">` : ''}
        <span>${record.title}</span>
      </a>
    `).join('');
    if (sidebarIssues) {
      sidebarIssues.innerHTML = fallback.map((record) => `
        <a class="jl-tool-btn jl-tool-btn-compact" href="${record.url}/issue/archive">
          <span>${record.title}</span>
          <i class="fas fa-arrow-right"></i>
        </a>
      `).join('');
    }
  }

  function cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function firstText(doc, selectors) {
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      const txt = el ? cleanText(el.textContent) : '';
      if (txt) return txt;
    }
    return '';
  }

  function firstLink(doc, selectors) {
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el && el.href && cleanText(el.textContent)) {
        return { href: el.href, text: cleanText(el.textContent) };
      }
    }
    return null;
  }

  function firstImage(doc, selectors) {
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el && el.src) return el.src;
    }
    return '';
  }

  function isEmptyIssue(doc) {
    const body = cleanText(doc.body ? doc.body.textContent : '').toLowerCase();
    return body.includes('no current issue') ||
      body.includes('has not published any issues') ||
      body.includes('no results') ||
      !doc.querySelector('.obj_article_summary, .cmp_article_list, .section');
  }

  async function loadIssue(record) {
    const currentUrl = record.url + '/issue/current';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(currentUrl, { credentials: 'same-origin', signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error('Issue not available');
    const html = await response.text();
    const doc = parser.parseFromString(html, 'text/html');
    if (isEmptyIssue(doc)) return null;
    const article = firstLink(doc, [
      '.obj_article_summary .title a',
      '.obj_article_summary h3 a',
      '.cmp_article_list .title a',
      '.section .title a',
      '.articles a'
    ]);
    const issueTitle = firstText(doc, [
      '.page_issue h1',
      '.obj_issue_toc .heading h1',
      '.obj_issue_toc h1',
      'main h1',
      '.pkp_structure_main h1'
    ]) || 'Current issue';
    const issueCover = firstImage(doc, [
      '.obj_issue_toc .cover img',
      '.page_issue .cover img',
      '.issue_cover img',
      '.cover img'
    ]) || record.cover;
    return {
      journalTitle: record.title,
      journalUrl: record.url,
      issueUrl: currentUrl,
      issueTitle,
      issueCover,
      article
    };
  }

  function renderEmpty() {
    featured.innerHTML = '<p class="jl-control-note">No published issue could be detected from the public OJS pages yet.</p>';
    issues.innerHTML = '<span class="jl-control-note">No active issue links found.</span>';
    if (sidebarIssues) {
      sidebarIssues.innerHTML = '<p class="jl-control-note">No public current issue detected.</p>';
    }
  }

  function renderPublished(records) {
    const usable = records.filter(Boolean);
    if (!usable.length) {
      renderFallbackRecords();
      return;
    }

    featured.innerHTML = usable.slice(0, 3).map((record) => {
      const articleHref = record.article ? record.article.href : record.issueUrl;
      const articleText = record.article ? record.article.text : record.issueTitle;
      return `
        <a class="jl-dynamic-article" href="${articleHref}">
          ${record.issueCover ? `<img src="${record.issueCover}" alt="${record.journalTitle} issue cover" loading="lazy" decoding="async">` : ''}
          <span>
            <strong>${articleText}</strong>
            <em>${record.journalTitle}</em>
          </span>
        </a>
      `;
    }).join('');

    issues.innerHTML = usable.slice(0, 4).map((record) => `
      <a class="jl-dynamic-issue" href="${record.issueUrl}">
        ${record.issueCover ? `<img src="${record.issueCover}" alt="${record.journalTitle} cover" loading="lazy" decoding="async">` : ''}
        <span>${record.journalTitle}</span>
      </a>
    `).join('');

    if (sidebarIssues) {
      sidebarIssues.innerHTML = usable.slice(0, 5).map((record) => `
        <a class="jl-tool-btn jl-tool-btn-compact" href="${record.issueUrl}">
          <span>${record.journalTitle}</span>
          <i class="fas fa-arrow-right"></i>
        </a>
      `).join('');
    }
  }

  renderFallbackRecords();

  Promise.allSettled(baseRecords.map(loadIssue)).then((results) => {
    renderPublished(results.map((result) => result.status === 'fulfilled' ? result.value : null));
  }).catch(function() {
    if (!featured.querySelector('a')) renderEmpty();
  });
});
</script>
{/literal}

{literal}
<script>
(function() {
  const directory = document.getElementById('journalDirectory');
  const list = document.getElementById('journalList');
  const searchInput = document.getElementById('journalSearch');
  const alphaNav = document.getElementById('alphaNav');
  const drawerAlphaNav = document.getElementById('drawerAlphaNav');
  const countEl = document.getElementById('resultSummary') || document.getElementById('journalCount');
  const resultSummary = document.getElementById('resultSummary');
  const toolbarSummaryEls = Array.from(document.querySelectorAll('[data-toolbar-summary]'));
  const activeFilterEls = Array.from(document.querySelectorAll('[data-active-filters]'));
  const noResults = document.getElementById('noResults');
  const journalFinder = document.getElementById('journalFinder');
  const resetFilters = document.getElementById('resetFilters');
  const clearLetterFilter = document.getElementById('clearLetterFilter');
  const drawerClearLetterFilter = document.getElementById('drawerClearLetterFilter');
  const drawerLetterTools = document.getElementById('drawerLetterTools');
  const mobileToolsToggle = document.getElementById('jlMobileToolsToggle');
  const mobileToolClosers = Array.from(document.querySelectorAll('[data-jl-tools-close]'));

  if (!directory || !list) return;

  const subjectKeywords = {
    health: ['health', 'medicine', 'medical', 'nursing', 'midwifery', 'bidan', 'perawat', 'farmasi', 'pharmacy', 'wellness', 'public health', 'dentistry', 'oral', 'gizi', 'nutrition', 'promkes', 'bioscience', 'biology', 'biological'],
    education: ['education', 'social', 'community', 'communication', 'teacher', 'learning', 'guru', 'academic', 'economic', 'economics', 'athletics', 'sport', 'olahraga', 'child', 'development', 'kindergarten'],
    technology: ['engineering', 'technology', 'digital', 'industrial', 'komputer', 'computer', 'computing', 'mining', 'aquaculture', 'aquatic', 'agribusiness', 'agriculture', 'agricultural', 'chemistry', 'chemical', 'kimia', 'physics', 'mathematics', 'math', 'numerical', 'laboratory', 'observation', 'observat', 'experimental', 'experiment'],
    humanities: ['policy', 'humanities', 'human', 'culture', 'cultural', 'language', 'ethic', 'ethics', 'ethical', 'religion', 'sharia', 'syariah', 'yurisprudence', 'jurisprudence', 'islamic', 'creativity', 'behavioral', 'psychological', 'psychology', 'art', 'arts', 'artistic', 'artwork', 'graphic', 'design', 'desain', 'law', 'laws', 'legal']
  };

  const indexingKeywords = {
    'sinta': ['sinta', 's1', 's2', 's3', 's4', 's5', 's6'],
    'doaj': ['doaj'],
    'google scholar': ['google scholar', 'scholar'],
    'garuda': ['garuda'],
    'crossref': ['crossref', 'doi']
  };

  const state = {
    query: '',
    letter: '',
    subject: '',
    indexing: '',
    sort: 'az'
  };

  const inProgressRegex = /in\s+the\s+process\s+of\s+being\s+indexed|in\s+the\s+process\s+of|in\s+process\s+of|is\s+in\s+the\s+process|in\s+progress|sedang\s+diproses|proses\s+indeks|dalam\s+proses|proses\s+pengindeksan|under\s+evaluation/i;

  const items = Array.from(list.querySelectorAll('.jl-item')).map((node) => {
    const name = node.dataset.name || '';
    const desc = node.dataset.desc || '';
    const shortDesc = node.dataset.shortDesc || '';
    const cleanedDesc = desc.replace(/data:[^;]+;base64,[a-zA-Z0-9/+\s=]+/gi, '');
    const splitParts = cleanedDesc.split(inProgressRegex);
    const indexedDesc = splitParts[0] || '';
    return {
      node,
      id: node.dataset.journalId || '',
      name,
      desc: cleanedDesc,
      shortDesc: shortDesc,
      search: (name + ' ' + cleanedDesc).toLowerCase(),
      indexingSearch: (name + ' ' + indexedDesc).toLowerCase(),
      subjectSearch: (name + ' ' + shortDesc).toLowerCase()
    };
  });

  function matchesKeyword(item, groups, key) {
    if (!key) return true;
    return (groups[key] || [key]).some((keyword) => item.search.includes(keyword));
  }

  function matchesIndexingKeyword(item, groups, key) {
    if (!key) return true;
    return (groups[key] || [key]).some((keyword) => item.indexingSearch.includes(keyword));
  }

  function matchesSubjectKeyword(item, groups, key) {
    if (!key) return true;
    const text = item.subjectSearch;
    const kwList = groups[key] || [key];
    const strictWords = ['art', 'arts', 'law', 'laws', 'legal'];
    return kwList.some((kw) => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (strictWords.indexOf(kw) !== -1) {
        return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
      }
      return new RegExp('\\b' + escaped, 'i').test(text);
    });
  }

  function baseMatches(item) {
    const query = state.query.trim().toLowerCase();
    if (query && !item.search.includes(query)) return false;
    if (state.subject && !matchesSubjectKeyword(item, subjectKeywords, state.subject)) return false;
    if (state.indexing && !matchesIndexingKeyword(item, indexingKeywords, state.indexing)) return false;
    return true;
  }

  const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  function compareNames(a, b) {
    const result = nameCollator.compare(a.name, b.name);
    return state.sort === 'za' ? -result : result;
  }

  function compareLetters(a, b) {
    const result = nameCollator.compare(a, b);
    return state.sort === 'za' ? -result : result;
  }

  function visibleItems() {
    return items
      .filter(baseMatches)
      .filter((item) => !state.letter || item.name.charAt(0).toUpperCase() === state.letter)
      .sort(compareNames);
  }

  function updateButtonCounts() {
    document.querySelectorAll('[data-subject]').forEach((button) => {
      const key = button.dataset.subject;
      const count = items.filter((item) => matchesSubjectKeyword(item, subjectKeywords, key)).length;
      const countSpan = button.querySelector('.count') || button.querySelector('.jl-tool-count');
      if (countSpan) countSpan.textContent = count;
      button.disabled = count === 0;
      button.classList.toggle('is-disabled', count === 0);
      button.classList.toggle('is-active', state.subject === key);
    });

    document.querySelectorAll('[data-indexing]').forEach((button) => {
      const key = button.dataset.indexing;
      const count = items.filter((item) => matchesIndexingKeyword(item, indexingKeywords, key)).length;
      const countSpan = button.querySelector('.count') || button.querySelector('.jl-tool-count');
      if (countSpan) countSpan.textContent = count;
      button.disabled = count === 0;
      button.classList.toggle('is-disabled', count === 0);
      button.classList.toggle('is-active', state.indexing === key);
    });

    document.querySelectorAll('[data-sort]').forEach((button) => {
      button.classList.toggle('is-active', state.sort === button.dataset.sort);
    });

    [clearLetterFilter, drawerClearLetterFilter].forEach((button) => {
      if (button) button.classList.toggle('is-visible', !!state.letter);
    });
  }

  function buildAlphaNav(target) {
    const activeLetters = arguments.length > 1 ? arguments[1] : [];
    target.innerHTML = '';
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').sort(compareLetters);

    const allBtn = document.createElement('a');
    allBtn.href = '#';
    allBtn.className = 'jl-alpha-btn jl-alpha-all' + (!state.letter ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', function(e) {
      e.preventDefault();
      state.letter = '';
      render();
      showResultsAfterApply();
    });
    target.appendChild(allBtn);

    allLetters.forEach((letter) => {
      const btn = document.createElement('a');
      btn.href = '#';
      btn.className = 'jl-alpha-btn' + (state.letter === letter ? ' active' : '');
      if (!activeLetters.includes(letter)) btn.classList.add('disabled');
      btn.textContent = letter;
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (btn.classList.contains('disabled')) return;
        state.letter = state.letter === letter ? '' : letter;
        render();
        showResultsAfterApply();
      });
      target.appendChild(btn);
    });
  }

  function renderFiltersSummary(count) {
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function(char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
      });
    }

    const chips = [];
    if (state.query) chips.push('Search: ' + state.query);
    if (state.letter) chips.push('Letter: ' + state.letter);
    if (state.subject) chips.push('Subject: ' + state.subject);
    if (state.indexing) chips.push('Indexing: ' + state.indexing);

    const filtersHtml = chips.length
      ? chips.map((chip) => '<span class="jl-filter-chip">' + escapeHtml(chip) + '</span>').join('')
      : '<span class="jl-filter-chip">All journals</span>';

    activeFilterEls.forEach((el) => {
      el.innerHTML = filtersHtml;
    });

    const summaryText = count + ' journal' + (count !== 1 ? 's' : '') + ' visible. Sorted ' + (state.sort === 'za' ? 'descending.' : 'ascending.');
    toolbarSummaryEls.forEach((el) => {
      el.textContent = summaryText;
    });
  }

  function render() {
    const alphaBase = items.filter(baseMatches);
    const activeLetters = Array.from(new Set(alphaBase.map((item) => item.name.charAt(0).toUpperCase()))).sort(compareLetters);
    const shown = visibleItems();
    const grouped = {};

    directory.classList.add('is-compact');
    directory.classList.toggle('is-sort-za', state.sort === 'za');

    list.innerHTML = '';
    shown.forEach((item) => {
      const letter = item.name.charAt(0).toUpperCase() || '?';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    });

    Object.keys(grouped)
      .sort(compareLetters)
      .forEach((letter) => {
      const header = document.createElement('div');
      header.className = 'jl-letter-header';
      header.id = 'letter-' + letter;
      header.innerHTML = '<span>' + letter + '</span>';
      list.appendChild(header);

      grouped[letter].forEach((item) => {
        list.appendChild(item.node);
      });
    });

    if (shown.length === 0) {
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
    }

    if (countEl) {
      countEl.textContent = shown.length + (shown.length === 1 ? ' journal found' : ' journals found');
    }
    renderFiltersSummary(shown.length);
    updateButtonCounts();
    if (alphaNav) buildAlphaNav(alphaNav, activeLetters);
    if (drawerAlphaNav) buildAlphaNav(drawerAlphaNav, activeLetters);
  }

  function openDirectoryTools() {
    directory.classList.add('is-tools-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDirectoryTools() {
    directory.classList.remove('is-tools-open');
    document.body.style.overflow = '';
  }

  function showResultsAfterApply() {
    if (window.innerWidth < 992) {
      closeDirectoryTools();
      const resultsHeader = document.getElementById('directoryResultsHeader');
      if (resultsHeader) {
        resultsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // Decoupled: Hero search input is for global article search, not directory filtering.
  // Sidebar journalFinder handles local directory filtering.
  journalFinder.addEventListener('input', function() {
    state.query = this.value;
    render();
  });

  document.querySelectorAll('[data-subject]').forEach((button) => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const key = this.dataset.subject;
      state.subject = state.subject === key ? '' : key;
      render();
      showResultsAfterApply();
    });
  });

  document.querySelectorAll('[data-indexing]').forEach((button) => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const key = this.dataset.indexing;
      state.indexing = state.indexing === key ? '' : key;
      render();
      showResultsAfterApply();
    });
  });

  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      state.sort = this.dataset.sort;
      render();
    });
  });

  if (resetFilters) {
    resetFilters.addEventListener('click', function(e) {
      e.preventDefault();
      state.query = '';
      state.letter = '';
      state.subject = '';
      state.indexing = '';
      state.sort = 'az';
      searchInput.value = '';
      journalFinder.value = '';
      clearHighlight();
      render();
      showResultsAfterApply();
    });
  }

  function clearHighlight() {
    const activeChs = document.querySelectorAll('.jl-filter-chip');
    activeFilterEls.forEach((el) => {
      el.innerHTML = '<span class="jl-filter-chip">All journals</span>';
    });
  }

  [clearLetterFilter, drawerClearLetterFilter].forEach((button) => {
    if (button) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        state.letter = '';
        render();
      });
    }
  });

  if (mobileToolsToggle) {
    mobileToolsToggle.addEventListener('click', function(e) {
      e.preventDefault();
      openDirectoryTools();
    });
  }

  mobileToolClosers.forEach((closer) => {
    closer.addEventListener('click', function(e) {
      e.preventDefault();
      closeDirectoryTools();
    });
  });

  // Handle drawer background click
  const drawerBg = document.querySelector('.jl-sidebar-drawer-bg');
  if (drawerBg) {
    drawerBg.addEventListener('click', function() {
      closeDirectoryTools();
    });
  }

  // Handle quick links (all, search, letters)
  document.querySelectorAll('[data-jl-action]').forEach((el) => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      const action = this.dataset.jlAction;
      if (action === 'all') {
        closeDirectoryTools();
        state.query = '';
        state.letter = '';
        state.subject = '';
        state.indexing = '';
        state.sort = 'az';
        searchInput.value = '';
        journalFinder.value = '';
        clearHighlight();
        render();
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (action === 'search') {
        closeDirectoryTools();
        requestAnimationFrame(() => {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      if (action === 'letters') {
        openDirectoryTools();
        requestAnimationFrame(() => {
          if (drawerLetterTools) {
            drawerLetterTools.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    });
  });

  // Handle Hero Search form submission to prevent GET router parameter stripping in OJS
  const searchForm = document.getElementById('pimHeroSearchForm');
  const heroSearchInput = document.getElementById('pimHeroSearchInput');
  if (searchForm && heroSearchInput) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = heroSearchInput.value.trim();
      if (!query) return;
      
      const action = searchForm.getAttribute('action');
      if (action.indexOf('?') !== -1) {
        window.location.href = action + '&query=' + encodeURIComponent(query);
      } else {
        window.location.href = action + '?query=' + encodeURIComponent(query);
      }
    });
  }

  render();
})();
</script>
{/literal}

{include file="frontend/components/footer.tpl"}
