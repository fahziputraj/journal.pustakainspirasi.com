document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('i.fas, i.far, i.fab, i.fa').forEach(function(icon) {
    icon.setAttribute('aria-hidden', 'true');
  });

  // Ignore empty editor spacers in the two legacy journal blocks, while keeping
  // authored text, links, media and interactive widgets intact in the DOM.
  function isJournalSpacer(node) {
    return !(node.textContent || '').trim() && !node.hasAttribute('aria-label')
      && !node.querySelector('a, img, svg, input, button, select, textarea, iframe, video, audio, canvas, object, embed, [aria-label], [role], [id]');
  }
  document.querySelectorAll('body.pim_public_journal #customblock-sidebarrye > .content, body.pim_public_journal #customblock-flagcounterrye > .content').forEach(function(content) {
    Array.prototype.forEach.call(content.children, function(node) {
      if (node.tagName === 'P' && isJournalSpacer(node)) node.classList.add('pim-empty-spacer');
    });
    content.querySelectorAll('tr').forEach(function(row) {
      var cells = Array.prototype.slice.call(row.cells);
      if (cells.length && cells.every(isJournalSpacer)) row.classList.add('pim-empty-spacer');
    });
  });

  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    var publicNavQuery = window.matchMedia ? window.matchMedia('(max-width: 992px)') : null;

    function isPublicNavMobile() {
      return publicNavQuery ? publicNavQuery.matches : window.innerWidth <= 992;
    }

    function setPublicNavState(isOpen, restoreFocus) {
      var shouldOpen = !!isOpen && isPublicNavMobile();
      mainNav.classList.toggle('open', shouldOpen);
      document.body.classList.toggle('pim-public-nav-open', shouldOpen);
      navToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

      if (isPublicNavMobile()) {
        mainNav.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        if (shouldOpen) mainNav.removeAttribute('inert');
        else mainNav.setAttribute('inert', '');
      } else {
        mainNav.removeAttribute('aria-hidden');
        mainNav.removeAttribute('inert');
      }

      if (!shouldOpen && restoreFocus) navToggle.focus();
      if (shouldOpen) {
        var firstLink = mainNav.querySelector('a[href]');
        if (firstLink) window.requestAnimationFrame(function() { firstLink.focus(); });
      }
    }

    navToggle.addEventListener('click', function() {
      setPublicNavState(!mainNav.classList.contains('open'), false);
    });

    mainNav.addEventListener('click', function(e) {
      if (e.target.closest && e.target.closest('a[href]')) setPublicNavState(false, false);
    });

    document.addEventListener('click', function(e) {
      if (!mainNav.classList.contains('open')) return;
      if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
      setPublicNavState(false, false);
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        setPublicNavState(false, true);
      }
    });

    function handlePublicNavBreakpoint() {
      setPublicNavState(false, false);
    }

    if (publicNavQuery) {
      if (publicNavQuery.addEventListener) publicNavQuery.addEventListener('change', handlePublicNavBreakpoint);
      else if (publicNavQuery.addListener) publicNavQuery.addListener(handlePublicNavBreakpoint);
    }
    setPublicNavState(false, false);
  }

  var userItems = document.querySelectorAll('.pim-user-topbar .pim-user-list > li, .pim-user-topbar .pkp_navigation_user > li');
  var lastTouchTime = 0;

  document.addEventListener('touchstart', function() {
    lastTouchTime = Date.now();
  }, {passive: true});

  userItems.forEach(function(item) {
    var trigger = item.querySelector(':scope > a, :scope > button');
    var submenu = item.querySelector(':scope > ul');
    if (!trigger || !submenu) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = item.classList.contains('is-open');
      userItems.forEach(function(other) {
        if (other !== item) {
          other.classList.remove('is-open');
          var otherTrigger = other.querySelector(':scope > a, :scope > button');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
      if (isOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    submenu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  document.addEventListener('click', function() {
    userItems.forEach(function(item) {
      item.classList.remove('is-open');
      var trigger = item.querySelector(':scope > a, :scope > button');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    userItems.forEach(function(item) {
      item.classList.remove('is-open');
      var trigger = item.querySelector(':scope > a, :scope > button');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });

  // Popper style stripping removed to prevent layout thrashing and sluggishness.


  // Journal dock and bottom sheet (spec 2026-11-27-pim-journal-tools-design).
  // State lives on <body>: pim-tools-open plus pim-tools-tab-menu|links. Dock buttons open the
  // sheet on their panel, close it when tapped again and switch panels otherwise.
  var mobileToolsBar = document.querySelector('.pim-mobile-tools-bar');
  var mobileToolsClosers = document.querySelectorAll('[data-pim-tools-close]');
  var mobileToolsBackdrop = document.querySelector('.pim-mobile-tools-backdrop');
  var mobileMenuPanel = document.getElementById('pimJournalMenuPanel');
  var mobileLinksPanel = document.getElementById('pimJournalLinksPanel');
  var mobileSearchPanel = null;
  var mobileToolsQuery = window.matchMedia ? window.matchMedia('(max-width: 992px)') : null;
  var mobileToolsReturnFocus = null;
  var mobileToolsLastPanelFocus = null;
  var mobileToolsTitles = { menu: 'Journal menu', links: 'Journal information', search: 'Search' };

  // Quick search (plan 2026-11-27-pim-search-ui): a field at the top of the Journal Menu and a
  // Search sheet opened from the dock. Both submit GET <journal>/search/search?query=…
  var dockSearchLink = mobileToolsBar && mobileToolsBar.querySelector('.pim-dock-search');
  var menuSearchLink = mobileMenuPanel && mobileMenuPanel.querySelector('.pim-journal-tools-group a[href$="/search"]');
  var searchSource = dockSearchLink || menuSearchLink;
  var searchAction = searchSource ? searchSource.getAttribute('href').replace(/\/+$/, '') + '/search' : '';
  function buildSearchForm(className, inputId, placeholder) {
    var currentQuery = new URLSearchParams(window.location.search).get('query') || '';
    var form = document.createElement('form');
    form.className = className;
    form.setAttribute('action', searchAction);
    form.setAttribute('method', 'get');
    form.setAttribute('role', 'search');
    var label = document.createElement('label');
    label.className = 'pkp_screen_reader';
    label.setAttribute('for', inputId);
    label.textContent = 'Search this journal';
    var input = document.createElement('input');
    input.type = 'search';
    input.id = inputId;
    input.name = 'query';
    input.value = currentQuery;
    input.placeholder = placeholder || 'Search this journal';
    input.setAttribute('autocomplete', 'off');
    var button = document.createElement('button');
    button.type = 'submit';
    button.setAttribute('aria-label', 'Search');
    button.innerHTML = '<i class="fas fa-magnifying-glass" aria-hidden="true"></i>';
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(button);
    return form;
  }
  if (searchAction && mobileMenuPanel) {
    var toolsPanelInner = mobileMenuPanel.querySelector('.pim-journal-tools-panel');
    var toolsHead = toolsPanelInner && toolsPanelInner.querySelector('.pim-journal-tools-head');
    if (toolsPanelInner && !toolsPanelInner.querySelector('.pim-menu-search')) {
      toolsPanelInner.insertBefore(buildSearchForm('pim-menu-search', 'pimMenuSearchQuery', 'Search'), toolsHead ? toolsHead.nextSibling : toolsPanelInner.firstChild);
    }
  }
  if (searchAction && dockSearchLink) {
    mobileSearchPanel = document.createElement('aside');
    mobileSearchPanel.id = 'pimJournalSearchPanel';
    mobileSearchPanel.className = 'pim-search-sheet';
    mobileSearchPanel.setAttribute('aria-label', 'Search');
    mobileSearchPanel.appendChild(buildSearchForm('pim-sheet-search', 'pimSheetSearchQuery'));
    document.body.appendChild(mobileSearchPanel);
    dockSearchLink.setAttribute('data-pim-tools-tab', 'search');
    dockSearchLink.setAttribute('aria-controls', 'pimJournalSearchPanel');
    dockSearchLink.setAttribute('aria-expanded', 'false');
  }
  var mobileToolsTabs = Array.prototype.slice.call(document.querySelectorAll('.pim-mobile-tools-bar [data-pim-tools-tab]'));
  var mobileToolsPanels = { menu: mobileMenuPanel, links: mobileLinksPanel, search: mobileSearchPanel };

  if (!mobileLinksPanel) {
    mobileToolsTabs.forEach(function(button) {
      if (button.getAttribute('data-pim-tools-tab') === 'links') button.hidden = true;
    });
    if (mobileToolsBar) mobileToolsBar.classList.add('pim-dock--compact');
  }

  // Mark the current page for assistive technology; the visual state uses the same element.
  document.querySelectorAll('.pim-journal-tools-panel a.is-active').forEach(function(link) {
    link.setAttribute('aria-current', 'page');
  });

  function isMobileToolsViewport() {
    return mobileToolsQuery ? mobileToolsQuery.matches : window.innerWidth <= 992;
  }

  function addSheetHead(panel, tab) {
    if (!panel || panel.querySelector(':scope > .pim-sheet-head')) return;
    var head = document.createElement('div');
    head.className = 'pim-sheet-head';
    var title = document.createElement('h2');
    title.textContent = mobileToolsTitles[tab];
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'pim-sheet-close';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
    close.addEventListener('click', function() { closeMobileTools(); });
    head.appendChild(title);
    head.appendChild(close);
    panel.insertBefore(head, panel.firstChild);
  }
  addSheetHead(mobileMenuPanel, 'menu');
  addSheetHead(mobileLinksPanel, 'links');
  addSheetHead(mobileSearchPanel, 'search');

  function currentMobileTab() {
    if (document.body.classList.contains('pim-tools-tab-links')) return 'links';
    if (document.body.classList.contains('pim-tools-tab-search')) return 'search';
    return 'menu';
  }

  function syncDockButtons() {
    var open = document.body.classList.contains('pim-tools-open');
    var tab = currentMobileTab();
    mobileToolsTabs.forEach(function(button) {
      var active = open && button.getAttribute('data-pim-tools-tab') === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-expanded', active ? 'true' : 'false');
    });
  }

  function setMobileToolsTab(tab) {
    var selected = mobileToolsPanels[tab] ? tab : 'menu';
    document.body.classList.toggle('pim-tools-tab-menu', selected === 'menu');
    document.body.classList.toggle('pim-tools-tab-links', selected === 'links');
    document.body.classList.toggle('pim-tools-tab-search', selected === 'search');
    if (isMobileToolsViewport()) {
      [[mobileMenuPanel, 'menu'], [mobileLinksPanel, 'links'], [mobileSearchPanel, 'search']].forEach(function(entry) {
        if (!entry[0]) return;
        var shown = document.body.classList.contains('pim-tools-open') && entry[1] === selected;
        entry[0].setAttribute('aria-hidden', shown ? 'false' : 'true');
        if (shown) entry[0].removeAttribute('inert');
        else entry[0].setAttribute('inert', '');
      });
    }
    syncDockButtons();
  }

  function getSelectedMobilePanel() {
    return mobileToolsPanels[currentMobileTab()] || mobileMenuPanel;
  }

  function isMobileToolsPanelControl(control) {
    return !!control && ((mobileMenuPanel && mobileMenuPanel.contains(control))
      || (mobileLinksPanel && mobileLinksPanel.contains(control))
      || (mobileSearchPanel && mobileSearchPanel.contains(control)));
  }

  function getMobileToolsFocusable(container) {
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')).filter(function(control) {
      var visibility = window.getComputedStyle(control).visibility;
      return control.getClientRects().length && control.tabIndex >= 0
        && !control.matches(':disabled') && !control.closest('[inert]')
        && visibility !== 'hidden' && visibility !== 'collapse';
    });
  }

  function focusFirstInPanel() {
    var panel = getSelectedMobilePanel();
    var first = panel && (panel.querySelector('input[name="query"]') || panel.querySelector('.pim-sheet-close') || getMobileToolsFocusable(panel)[0]);
    if (first) window.requestAnimationFrame(function() { first.focus(); });
  }

  function openMobileTools(tab, opener) {
    if (!isMobileToolsViewport()) return;
    mobileToolsReturnFocus = opener || document.activeElement;
    document.body.classList.add('pim-tools-open');
    setMobileToolsTab(tab);
    if (mobileToolsBackdrop) mobileToolsBackdrop.setAttribute('aria-hidden', 'false');
    focusFirstInPanel();
  }

  function closeMobileTools(options) {
    document.body.classList.remove('pim-tools-open');
    if (mobileToolsBackdrop) mobileToolsBackdrop.setAttribute('aria-hidden', 'true');
    if (isMobileToolsViewport()) {
      [mobileMenuPanel, mobileLinksPanel, mobileSearchPanel].forEach(function(panel) {
        if (!panel) return;
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('inert', '');
      });
    }
    syncDockButtons();
    if ((!options || options.restoreFocus !== false) && mobileToolsReturnFocus && mobileToolsReturnFocus.focus) {
      mobileToolsReturnFocus.focus();
    }
  }

  if (mobileToolsTabs.length) {
    // CSS can hide a focused rail before the resize event runs. Remember its
    // last focused control so the dock can receive focus instead.
    document.addEventListener('focusin', function(e) {
      mobileToolsLastPanelFocus = isMobileToolsPanelControl(e.target) ? e.target : null;
    });
    document.addEventListener('pointerdown', function(e) {
      if (!isMobileToolsPanelControl(e.target)) mobileToolsLastPanelFocus = null;
    });
    setMobileToolsTab('menu');
  }

  mobileToolsTabs.forEach(function(button) {
    button.addEventListener('click', function(e) {
      var tab = button.getAttribute('data-pim-tools-tab') || 'menu';
      // The dock Search link keeps its href (no-JS fallback); with JS it opens the Search sheet.
      if (button.tagName === 'A') {
        if (!isMobileToolsViewport()) return;
        e.preventDefault();
      }
      if (!document.body.classList.contains('pim-tools-open')) {
        openMobileTools(tab, button);
      } else if (currentMobileTab() === tab) {
        closeMobileTools();
      } else {
        mobileToolsReturnFocus = button;
        setMobileToolsTab(tab);
        focusFirstInPanel();
      }
    });
  });

  mobileToolsClosers.forEach(function(closer) {
    closer.addEventListener('click', function() { closeMobileTools(); });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.body.classList.contains('pim-tools-open')) closeMobileTools();
    if (e.key !== 'Tab' || !document.body.classList.contains('pim-tools-open')) return;
    var focusable = getMobileToolsFocusable(getSelectedMobilePanel()).concat(getMobileToolsFocusable(mobileToolsBar));
    if (!focusable.length) return;
    // Cycle panel then dock explicitly so Tab cannot escape into page content.
    var currentIndex = focusable.indexOf(document.activeElement);
    var nextIndex = currentIndex === -1 ? 0 : (currentIndex + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
    e.preventDefault();
    focusable[nextIndex].focus();
  });

  window.addEventListener('resize', function() {
    if (!isMobileToolsViewport()) {
      closeMobileTools({ restoreFocus: false });
      [mobileMenuPanel, mobileLinksPanel].forEach(function(panel) {
        if (!panel) return;
        panel.removeAttribute('aria-hidden');
        panel.removeAttribute('inert');
      });
    } else if (!document.body.classList.contains('pim-tools-open')) {
      var focusedControl = document.activeElement;
      var panelHadFocus = isMobileToolsPanelControl(focusedControl)
        || (focusedControl === document.body && isMobileToolsPanelControl(mobileToolsLastPanelFocus));
      closeMobileTools({ restoreFocus: false });
      if (panelHadFocus && mobileToolsTabs[0]) mobileToolsTabs[0].focus();
    }
  });

  if (isMobileToolsViewport()) closeMobileTools({ restoreFocus: false });

  var publicJournalHome = document.querySelector('body.pim_public_journal .page_index_journal');
  var publicJournalSidebar = document.querySelector('body.pim_public_journal .pkp_structure_sidebar');
  var createdWidgetKeys = {};

  function normalizeHeadingText(text) {
    return (text || '')
      .replace(/\s+/g, ' ')
      .replace(/[:]+/g, '')
      .trim()
      .toLowerCase();
  }

  function createSidebarWidget(title, nodes) {
    if (!publicJournalSidebar || !nodes.length) return;
    var widgetKey = normalizeHeadingText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (createdWidgetKeys[widgetKey]) return;
    var titleKey = normalizeHeadingText(title);
    var existingWidget = Array.prototype.slice.call(publicJournalSidebar.querySelectorAll('.pkp_block')).some(function(block) {
      var blockKey = block.getAttribute('data-gp-widget') || '';
      var blockTitle = block.querySelector('.title, h2, h3, h4');
      var blockTitleKey = normalizeHeadingText(blockTitle ? blockTitle.textContent : block.textContent);
      return blockKey === widgetKey || blockTitleKey.indexOf(titleKey) !== -1;
    });
    if (existingWidget) return;
    createdWidgetKeys[widgetKey] = true;
    var block = document.createElement('div');
    block.className = 'pkp_block gp-extracted-widget pim-widget-' + widgetKey;
    block.setAttribute('data-gp-widget', widgetKey);
    var heading = document.createElement('h2');
    heading.className = 'title';
    heading.textContent = title;
    var content = document.createElement('div');
    content.className = 'content';
    nodes.forEach(function(node) {
      content.appendChild(node);
    });
    block.appendChild(heading);
    block.appendChild(content);
    publicJournalSidebar.appendChild(block);
  }

  function createInlineHomepageWidget(title, nodes) {
    if (!publicJournalHome || !nodes.length) return;
    var host = publicJournalHome.querySelector('#pim-extracted-widgets-container');
    if (!host) return;
    var widgetKey = normalizeHeadingText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (createdWidgetKeys['inline-' + widgetKey]) return;
    createdWidgetKeys['inline-' + widgetKey] = true;
    var block = document.createElement('div');
    block.className = 'pim-home-inline-widget pim-home-inline-widget-' + widgetKey;
    block.setAttribute('data-gp-widget', widgetKey);
    var label = document.createElement('strong');
    label.className = 'pim-home-inline-widget-label';
    label.textContent = title;
    var content = document.createElement('div');
    content.className = 'pim-home-inline-widget-content';
    nodes.forEach(function(node) {
      content.appendChild(node);
    });
    block.appendChild(label);
    block.appendChild(content);
    host.appendChild(block);
  }

  function isImageOnlyNode(node) {
    if (!node || !/^(p|div|figure|span)$/i.test(node.tagName || '')) return false;
    if (!node.querySelector('img')) return false;
    var clone = node.cloneNode(true);
    clone.querySelectorAll('img, picture, source, br').forEach(function(el) {
      el.remove();
    });
    clone.querySelectorAll('a, span').forEach(function(el) {
      if (!el.textContent.replace(/\s+/g, '').trim()) el.remove();
    });
    return clone.textContent.replace(/\s+/g, '').trim() === '';
  }

  function getTopAdditionalBlock(node, container) {
    var target = node;
    while (target && target.parentElement && target.parentElement !== container) {
      target = target.parentElement;
    }
    return target && target !== container ? target : node;
  }

  function nodeTextWithoutImages(node) {
    if (!node) return '';
    var clone = node.cloneNode(true);
    clone.querySelectorAll('img, picture, source, br').forEach(function(el) {
      el.remove();
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function hasLongTextBefore(node) {
    var previous = node ? node.previousElementSibling : null;
    while (previous) {
      if (nodeTextWithoutImages(previous).length > 180) return true;
      previous = previous.previousElementSibling;
    }
    return false;
  }

  function removeAdditionalContentImage(img, container) {
    var wrapper = img.closest('p, figure, div, span') || img.parentElement;
    var topBlock = getTopAdditionalBlock(wrapper, container);
    if (topBlock && topBlock !== container && isImageOnlyNode(topBlock)) {
      topBlock.remove();
      return;
    }
    if (wrapper && wrapper !== container && isImageOnlyNode(wrapper)) {
      wrapper.remove();
      return;
    }
    img.remove();
  }

  function cleanupLeadingAdditionalContentImages() {
    if (!publicJournalHome) return;
    var containers = publicJournalHome.querySelectorAll('.pim-additional-home-content, .homepage_about, .additional_content');
    var homepageImage = publicJournalHome.querySelector('[data-gp-official-home-image] img, .homepage_image img');
    var homepageKey = homepageImage ? imageKey(homepageImage.getAttribute('src') || homepageImage.src || '') : '';
    var hasOfficialImage = !!publicJournalHome.querySelector('[data-gp-has-official-image]');
    containers.forEach(function(container) {
      var keptInlineCover = false;
      Array.prototype.slice.call(container.querySelectorAll('img')).forEach(function(img) {
        if (imageLooksLikeWidget(img)) return;
        // If already inside the official homepage_image div, skip it to let the stylesheet style it
        if (img.closest('[data-gp-official-home-image]') || img.closest('.homepage_image')) {
          return;
        }
        var key = imageKey(img.getAttribute('src') || img.src || '');
        var topBlock = getTopAdditionalBlock(img, container);
        var isDuplicateOfficial = homepageKey && key === homepageKey;
        var isEarlyCoverLikeImage = !hasLongTextBefore(topBlock) && (isImageOnlyNode(topBlock) || isImageOnlyNode(img.closest('p, figure, div, span')));
        // If no official homepage image exists, keep the first inline cover image
        if (!hasOfficialImage && !keptInlineCover && !isDuplicateOfficial) {
          // Style as centered image with restricted height
          img.style.cssText = 'float:none;display:block;width:auto;max-width:100%;height:auto;max-height:260px;margin:0 auto 24px;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);object-fit:contain;';
          // Ensure parent paragraph is centered
          if (img.parentNode && img.parentNode.tagName === 'P') {
            img.parentNode.style.textAlign = 'center';
            img.parentNode.style.display = 'block';
          }
          
          keptInlineCover = true;
          return;
        }
        if (!isDuplicateOfficial && !isEarlyCoverLikeImage) return;
        removeAdditionalContentImage(img, container);
      });
    });
  }

  function imageKey(src) {
    return (src || '')
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop()
      .toLowerCase();
  }

  function replaceWhatsappPromoBlocks() {
    var links = document.querySelectorAll('body.pim_public_journal .pkp_structure_sidebar a[href*="wa.me"], body.pim_public_journal .pkp_structure_sidebar a[href*="api.whatsapp.com"], body.pim_public_journal .pkp_structure_sidebar a[href*="whatsapp"]');
    links.forEach(function(link) {
      if (!link.querySelector('img') && !/whatsapp/i.test(link.textContent || '')) return;
      var row = link.closest('tr');
      var previousRow = row && row.previousElementSibling;
      if (previousRow && /contact\s*us/i.test(previousRow.textContent || '')) {
        var headerCell = previousRow.querySelector('td, th');
        if (headerCell) headerCell.textContent = 'Editorial Office';
      }
      var supportHtml = '<div class="pim-sidebar-support-card"><strong>Editorial Office</strong><span>Email: <a href="mailto:admin@pustakainspirasi.com">admin@pustakainspirasi.com</a></span><strong>Technical Support</strong><a href="https://wa.me/6285365202765" target="_blank" rel="noopener">For technical assistance only</a></div>';
      if (row) {
        var cell = row.querySelector('td, th') || row;
        cell.innerHTML = supportHtml;
      } else {
        link.outerHTML = supportHtml;
      }
    });
  }

  function removeRawMarketingFooterBlocks() {
    var candidates = document.querySelectorAll('body.pim_public_journal div[style*="border-top"], body.pim_public_journal div[style*="background:#ffffff"], body.pim_public_journal div[style*="background: #ffffff"], body.pim_public_journal .pim-additional-home-content div, body.pim_public_journal .pim-additional-home-content section');
    candidates.forEach(function(node) {
      var text = normalizeHeadingText(node.textContent || '');
      var looksLikeRawFooter = text.indexOf('journal identity') !== -1 ||
        (text.indexOf('publisher') !== -1 && text.indexOf('editorial office') !== -1 && text.indexOf('creative commons attribution') !== -1) ||
        (text.indexOf('pustaka inspirasi minang') !== -1 && text.indexOf('admin@pustakainspirasi.com') !== -1 && text.indexOf('all articles are published under') !== -1) ||
        (text.indexOf('graha indah asri housing complex') !== -1 && text.indexOf('editorial office') !== -1 && text.indexOf('website') !== -1);
      if (looksLikeRawFooter) {
        node.remove();
      }
    });
  }

  function relabelPublicSubmitButtons() {
    var controls = document.querySelectorAll('body.pim_public_journal a, body.pim_public_journal button');
    controls.forEach(function(control) {
      var text = (control.textContent || '').replace(/\s+/g, ' ').trim();
      if (text !== 'Publish' && text !== 'Publish Now') return;
      var icon = control.querySelector('i, svg');
      control.textContent = '';
      if (icon) {
        control.appendChild(icon);
        control.appendChild(document.createTextNode(' Submit Manuscript'));
      } else {
        control.textContent = 'Submit Manuscript';
      }
    });
  }

  function normalizeLegacySidebarContent() {
    if (!publicJournalSidebar) return;

    var legacyBlockLabels = {
      informationrye: 'Information',
      sidebarrye: 'Journal Information',
      flagcounterrye: 'Journal Resources'
    };

    Object.keys(legacyBlockLabels).forEach(function(blockName) {
      var block = publicJournalSidebar.querySelector('#customblock-' + blockName);
      if (!block) return;
      var title = block.querySelector(':scope > .title');
      if (!title) return;
      title.textContent = legacyBlockLabels[blockName];
      title.classList.add('pkp_screen_reader');
    });

    publicJournalSidebar.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
      var email = (link.getAttribute('href') || '').replace(/^mailto:/i, '').trim();
      if (!/^editor@(mcj|mbj|mcsj|mmj|mpj)\.com$/i.test(email)) return;
      link.setAttribute('href', 'mailto:admin@pustakainspirasi.com');
      link.textContent = 'admin@pustakainspirasi.com';
    });

    publicJournalSidebar.querySelectorAll('.pim-sidebar-section').forEach(function(section) {
      var clone = section.cloneNode(true);
      clone.querySelectorAll('.pim-sidebar-section-title, script, style').forEach(function(node) {
        node.remove();
      });
      var meaningfulText = clone.textContent.replace(/\s+/g, ' ').trim();
      var meaningfulElement = clone.querySelector('a[href], img[src], iframe[src], input, select, textarea, ul > li, ol > li');
      if (!meaningfulText && !meaningfulElement) section.remove();
    });
  }

  function hasWidgetKeyword(text) {
    var normalized = normalizeHeadingText(text);
    return [
      'already indexed by',
      'in the process of being indexed by',
      'being indexed by',
      'recommended tools',
      'citation analysis'
    ].some(function(key) {
      return normalized.indexOf(key) !== -1;
    });
  }

  function imageLooksLikeWidget(img) {
    var haystack = [
      img.getAttribute('src') || '',
      img.getAttribute('alt') || '',
      img.getAttribute('title') || ''
    ].join(' ').toLowerCase();
    return /google|crossref|scopus|sinta|garuda|mendeley|turnitin|grammarly|road|neliti|copernicus|dimensions|moraref|doaj|one.?search|index/.test(haystack);
  }

  function imageLooksLikeRecommendedTool(img) {
    var haystack = [
      img.getAttribute('src') || '',
      img.getAttribute('alt') || '',
      img.getAttribute('title') || ''
    ].join(' ').toLowerCase();
    return /mendeley|turnitin|grammarly/.test(haystack);
  }

  function getWidgetRemovalTarget(el, container) {
    if (!el || !container || el === container || el.closest('table')) return null;
    var target = el;
    while (target.parentElement && target.parentElement !== container) {
      var parent = target.parentElement;
      if (parent.closest('table')) return null;
      var parentText = (parent.textContent || '').replace(/\s+/g, ' ').trim();
      if (parent.children.length > 3 && parentText.length > 700) break;
      target = parent;
    }
    return target === container ? null : target;
  }

  function purgeWidgetContentFromContainer(container) {
    if (!container) return;
    var removalTargets = [];
    var nodes = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, section, figure, a, span, strong, b, img');

    nodes.forEach(function(node) {
      if (node.closest('table') || node.closest('#pim-extracted-widgets-container')) return;

      var shouldRemove = false;
      if (node.tagName === 'IMG') {
        shouldRemove = imageLooksLikeWidget(node);
      } else if (hasWidgetKeyword(node.textContent || '')) {
        shouldRemove = true;
      } else {
        var widgetImages = node.querySelectorAll ? Array.prototype.slice.call(node.querySelectorAll('img')).filter(imageLooksLikeWidget) : [];
        shouldRemove = widgetImages.length > 0 && !(node.textContent || '').replace(/\s+/g, ' ').trim();
      }

      if (!shouldRemove) return;
      var target = getWidgetRemovalTarget(node, container);
      if (target && removalTargets.indexOf(target) === -1) {
        removalTargets.push(target);
      }
    });

    removalTargets.forEach(function(target) {
      target.classList.add('pim-widget-source-removed');
      target.remove();
    });

    Array.prototype.slice.call(container.querySelectorAll('p, div, section, figure')).forEach(function(node) {
      if (node.closest('table')) return;
      if (node.children.length === 0 && !(node.textContent || '').replace(/\s+/g, '').trim()) {
        node.remove();
      }
    });
  }

  function normalizeContentText(text) {
    return (text || '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim()
      .toLowerCase();
  }

  function cleanupDuplicateHomeText() {
    if (!publicJournalHome) return;
    var additional = publicJournalHome.querySelector('.pim-additional-home-content');
    if (!additional) return;

    var baseline = Array.prototype.slice.call(publicJournalHome.querySelectorAll('.gp-journal-description p, .gp-journal-description div'))
      .map(function(node) { return normalizeContentText(node.textContent); })
      .filter(function(text) { return text.length > 120; });

    var seen = {};
    Array.prototype.slice.call(additional.querySelectorAll('p, div')).forEach(function(node) {
      if (node.closest('table') || node.querySelector('table') || node.querySelector('img')) return;
      var text = normalizeContentText(node.textContent);
      if (text.length <= 120) return;
      var duplicatesDescription = baseline.some(function(base) {
        return base.indexOf(text) !== -1 || text.indexOf(base) !== -1;
      });
      if (duplicatesDescription || seen[text]) {
        node.remove();
        return;
      }
      seen[text] = true;
    });
  }

  function extractJournalHomepageWidgets() {
    if (!publicJournalHome) return;

    cleanupLeadingAdditionalContentImages();

    var preferredContainers = publicJournalHome.querySelectorAll('.pim-additional-home-content');
    var containers = preferredContainers.length ? preferredContainers : publicJournalHome.querySelectorAll('.homepage_about, .additional_content');
    if (!containers.length) return;

    var matchers = [
      { key: 'already indexed by', title: 'Indexed By' },
      { key: 'in the process of being indexed by', title: 'Indexing In Progress' },
      { key: 'recommended tools', title: 'Recommended Tools' },
      { key: 'citation analysis', title: 'Citation Analysis', hideOnly: true },
      { key: 'indexed by', title: 'Indexed By' }
    ];

    containers.forEach(function(container) {
      // Unwrap single TinyMCE div wrappers if they exist
      var targetContainer = container;
      while (targetContainer.children.length === 1 && targetContainer.children[0].tagName === 'DIV') {
        targetContainer = targetContainer.children[0];
      }
      var children = Array.prototype.slice.call(targetContainer.children || []);
      if (!children.length) return;

      matchers.forEach(function(matcher) {
        var startIndex = children.findIndex(function(child) {
          if (child.matches && child.matches('table')) return false;
          if (child.querySelector && child.querySelector('table')) return false;
          return normalizeHeadingText(child.textContent).indexOf(matcher.key) !== -1;
        });

        if (startIndex === -1) return;

        var endIndex = children.length;
        for (var i = startIndex + 1; i < children.length; i += 1) {
          var nextText = normalizeHeadingText(children[i].textContent);
          var isNextWidget = matchers.some(function(nextMatcher) {
            return nextText.indexOf(nextMatcher.key) !== -1;
          });
          if (isNextWidget) {
            endIndex = i;
            break;
          }
        }

        // Extract content to sidebar widget before removing from center panel
        if (!matcher.hideOnly) {
          var extractedNodes = children.slice(startIndex, endIndex).map(function(node) {
            return node.cloneNode(true);
          });
          // Skip the heading node (first), keep only the logo/content nodes
          var widgetNodes = extractedNodes.length > 1 ? extractedNodes.slice(1) : extractedNodes;
          if (widgetNodes.length) {
            createSidebarWidget(matcher.title, widgetNodes);
          }
        }

        // Remove from center panel (Additional Content area)
        for (var removeIndex = endIndex - 1; removeIndex >= startIndex; removeIndex -= 1) {
          children[removeIndex].remove();
        }
        children = Array.prototype.slice.call(targetContainer.children || []);
      });

      // Second pass: deep scan for any remaining "indexed by" sections nested in wrappers
      var deepIndexedMatchers = ['already indexed by', 'indexed by', 'recommended tools', 'citation analysis'];
      var allDeep = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, strong, b, div');
      allDeep.forEach(function(el) {
        if (el.closest('table')) return;
        var txt = normalizeHeadingText(el.textContent);
        var isIndexedSection = deepIndexedMatchers.some(function(key) {
          return txt.indexOf(key) !== -1;
        });
        if (!isIndexedSection) return;
        // Walk up to find the nearest block-level wrapper inside the container
        var target = el;
        while (target.parentNode && target.parentNode !== container && target.parentNode.children.length === 1) {
          target = target.parentNode;
        }
        // If the element IS the container content itself, hide the section by finding its wrapping element
        if (target === container) return;
        target.style.display = 'none';
      });

      if (!container.textContent.replace(/\s+/g, ' ').trim()) {
        container.remove();
      }
    });

    // Third pass: extract orphan image-only blocks containing indexer logos
    // These are paragraphs with logos but NO keyword text (e.g. no "Already Indexed by" label)
    Array.prototype.slice.call(containers).forEach(function(container) {
      if (!container.parentNode) return; // already removed
      var blocks = container.querySelectorAll('p, div, figure');
      var orphanIndexerNodes = [];
      blocks.forEach(function(block) {
        if (block.closest('table') || block.closest('#pim-extracted-widgets-container')) return;
        // Skip blocks that have substantial text content (keyword blocks already handled)
        var textOnly = nodeTextWithoutImages(block);
        if (textOnly.length > 20) return;
        // Check if this block contains indexer logo images (but not tool images like mendeley/turnitin)
        var imgs = Array.prototype.slice.call(block.querySelectorAll('img'));
        var indexerImgs = imgs.filter(function(img) {
          return imageLooksLikeWidget(img) && !imageLooksLikeRecommendedTool(img);
        });
        if (indexerImgs.length >= 2) {
          orphanIndexerNodes.push(block);
        }
      });
      if (orphanIndexerNodes.length) {
        var clonedNodes = orphanIndexerNodes.map(function(node) {
          return node.cloneNode(true);
        });
        createSidebarWidget('Indexed By', clonedNodes);
        orphanIndexerNodes.forEach(function(node) {
          node.remove();
        });
      }
    });

    Array.prototype.slice.call(containers).forEach(purgeWidgetContentFromContainer);
    cleanupDuplicateHomeText();
  }

  function handleBrokenImages() {
    var imgs = document.querySelectorAll('.pkp_structure_sidebar img, #pim-extracted-widgets-container img, .gp-extracted-widget img, .pim-journals-grid img');
    imgs.forEach(function(img) {
      if (img.complete) {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          replaceWithFallbackBadge(img);
        }
      } else {
        img.addEventListener('error', function() {
          replaceWithFallbackBadge(img);
        });
      }
    });
  }

  function replaceWithFallbackBadge(img) {
    if (img.classList.contains('pim-has-fallback-badge')) return;
    img.classList.add('pim-has-fallback-badge');
    var alt = img.getAttribute('alt') || img.getAttribute('title') || 'Logo';
    var link = img.closest('a');
    if (link) {
      var siblingText = link.textContent.replace(/\s+/g, ' ').trim();
      if (!siblingText) {
        link.className = 'pim-fallback-badge';
        link.innerHTML = alt;
        return;
      }
    }
    var badge = document.createElement('span');
    badge.className = 'pim-fallback-badge';
    badge.textContent = alt;
    img.parentNode.replaceChild(badge, img);
  }

  replaceWhatsappPromoBlocks();
  normalizeLegacySidebarContent();
  removeRawMarketingFooterBlocks();
  relabelPublicSubmitButtons();
  extractJournalHomepageWidgets();
  handleBrokenImages();
});

/*
 * Journal home "Past Issues" (spec D-critique: no empty section headings).
 * Builds cards from the public archive page with DOM text only (titles are never parsed as HTML),
 * skips the first summary (the current issue, shown above) and keeps the section hidden when
 * there is nothing else to show.
 */
window.PIM = window.PIM || {};
window.PIM.renderPastIssues = function (container, archiveHtml, options) {
  var limit = (options && options.limit) || 4;
  var grid = container.querySelector('.pim-issues-grid');
  if (!grid) return 0;
  grid.textContent = '';
  var doc = new DOMParser().parseFromString(archiveHtml, 'text/html');
  var summaries = Array.prototype.slice.call(doc.querySelectorAll('.obj_issue_summary'), 1, 1 + limit);
  summaries.forEach(function (item) {
    var titleEl = item.querySelector('.title') || item.querySelector('h2 a') || item.querySelector('h2');
    var linkEl = item.querySelector('a.title[href]') || item.querySelector('a[href]');
    var href = linkEl ? linkEl.getAttribute('href') : '';
    if (!href || !/^(https?:)?\//.test(href)) return;
    var seriesEl = item.querySelector('.series') || item.querySelector('.identification');
    var imgEl = item.querySelector('.cover img') || item.querySelector('img');
    var title = titleEl ? titleEl.textContent.trim() : '';

    var card = document.createElement('article');
    card.className = 'pim-issue-card';
    var coverLink = document.createElement('a');
    coverLink.className = 'pim-issue-card__cover';
    coverLink.href = href;
    coverLink.setAttribute('tabindex', '-1');
    coverLink.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.src = imgEl && imgEl.getAttribute('src') ? imgEl.getAttribute('src') : (container.dataset.fallbackCover || '');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    coverLink.appendChild(img);
    var heading = document.createElement('h3');
    var titleLink = document.createElement('a');
    titleLink.href = href;
    titleLink.textContent = title || 'View issue';
    heading.appendChild(titleLink);
    card.appendChild(coverLink);
    card.appendChild(heading);
    if (seriesEl && seriesEl.textContent.trim()) {
      var series = document.createElement('p');
      series.className = 'pim-issue-card__series';
      series.textContent = seriesEl.textContent.trim();
      card.appendChild(series);
    }
    grid.appendChild(card);
  });
  var count = grid.children.length;
  container.hidden = count === 0;
  return count;
};

document.addEventListener('DOMContentLoaded', function () {
  var containers = document.querySelectorAll('[data-pim-past-issues]');
  if (!containers.length) return;
  Array.prototype.forEach.call(containers, function (container) {
    var url = container.dataset.archiveUrl;
    if (!url) return;
    fetch(url, { credentials: 'same-origin' })
      .then(function (response) { return response.ok ? response.text() : ''; })
      .then(function (html) { window.PIM.renderPastIssues(container, html || ''); })
      .catch(function () { container.hidden = true; })
      .then(function () { window.__pimPastIssuesDone = true; });
  });
});

/*
 * Journal information rail: each titled OJS block becomes a disclosure section
 * (spec 2026-11-27-pim-journal-tools-design). Links, order and stored HTML stay intact;
 * only a leading/trailing "::" decoration is removed from visible text.
 */
window.PIM = window.PIM || {};
window.PIM.stripRailDecoration = function (root) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = walker.nextNode())) {
    var match = /^(\s*)::\s*(.*?)\s*::(\s*)$/.exec(node.nodeValue);
    if (match && match[2] && !(node.parentElement && node.parentElement.closest('a'))) {
      node.nodeValue = match[1] + match[2] + match[3];
    }
  }
};
window.PIM.buildRailSections = function (panel, options) {
  if (!panel) return 0;
  var openCount = options && typeof options.open === 'number' ? options.open : 2;
  window.PIM.stripRailDecoration(panel);
  var blocks = Array.prototype.filter.call(panel.children, function (el) { return el.classList.contains('pkp_block'); });
  var index = 0;
  blocks.forEach(function (block) {
    if (block.querySelector(':scope > details.pim-rail-section')) { index++; return; }
    var title = block.querySelector(':scope > .title');
    var label = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
    var heading = null;
    if (!label) {
      heading = block.querySelector(':scope > .content > h2, :scope > .content > h3, :scope > .content > h4');
      label = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
    }
    if (!label) return;
    var details = document.createElement('details');
    details.className = 'pim-rail-section';
    if (index < openCount) details.open = true;
    var summary = document.createElement('summary');
    summary.className = 'pim-rail-summary';
    if (heading) {
      summary.appendChild(heading);
    } else {
      var text = document.createElement('span');
      text.textContent = label;
      summary.appendChild(text);
      title.hidden = true;
    }
    var body = document.createElement('div');
    body.className = 'pim-rail-body';
    Array.prototype.slice.call(block.childNodes).forEach(function (child) {
      if (child !== title) body.appendChild(child);
    });
    details.appendChild(summary);
    details.appendChild(body);
    block.appendChild(details);
    index++;
  });
  return panel.querySelectorAll('details.pim-rail-section').length;
};
document.addEventListener('DOMContentLoaded', function () {
  window.PIM.buildRailSections(document.getElementById('pimJournalLinksPanel'));
});

/*
 * Search page (plan 2026-11-27-pim-search-ui): inline search bar, labelled date parts inside a
 * collapsible "Refine results", and honest empty states. Field names and the form action are untouched.
 */
window.PIM = window.PIM || {};
window.PIM.enhanceSearchPage = function (root) {
  var form = root.querySelector('.page_search form.cmp_form');
  if (!form || form.getAttribute('data-pim-enhanced')) return;
  form.setAttribute('data-pim-enhanced', '1');
  form.classList.add('pim-search-form');

  var advanced = form.querySelector('fieldset.search_advanced');
  if (advanced) {
    advanced.querySelectorAll('.date_range fieldset').forEach(function (set) {
      var legend = set.querySelector('legend');
      if (legend) legend.textContent = legend.textContent.trim().replace(/^Published (After|Before)$/i, function (m, w) { return 'Published ' + w.toLowerCase(); });
      Array.prototype.slice.call(set.querySelectorAll(':scope > label')).forEach(function (label) {
        var select = label.nextElementSibling;
        if (!select || select.tagName !== 'SELECT') return;
        var part = document.createElement('div');
        part.className = 'pim-date-part';
        set.insertBefore(part, label);
        part.appendChild(label);
        part.appendChild(select);
      });
    });
    var authorLabel = advanced.querySelector('.author label');
    if (authorLabel && /^by author$/i.test(authorLabel.textContent.trim())) authorLabel.textContent = 'Author';
    var details = document.createElement('details');
    details.className = 'pim-search-filters';
    var summary = document.createElement('summary');
    summary.className = 'pim-search-filters__summary';
    summary.textContent = 'Refine results';
    details.appendChild(summary);
    advanced.parentNode.insertBefore(details, advanced);
    details.appendChild(advanced);
    details.open = Array.prototype.some.call(advanced.querySelectorAll('select, input'), function (el) {
      return el.value && el.value.trim();
    });
  }

  var notice = root.querySelector('.page_search .cmp_notification');
  var results = root.querySelector('.page_search .search_results');
  var queryInput = form.querySelector('input[name="query"]');
  var query = queryInput ? queryInput.value.trim() : '';
  if (notice && results && !results.children.length && /no results/i.test(notice.textContent)) {
    notice.textContent = '';
    if (!query) {
      notice.textContent = 'Search titles, abstracts and authors in this journal.';
      notice.classList.add('pim-search-hint');
    } else {
      var strong = document.createElement('strong');
      strong.textContent = 'No articles match "' + query + '".';
      notice.appendChild(strong);
      notice.appendChild(document.createTextNode(' Try fewer or different words.'));
      notice.classList.add('pim-search-empty');
    }
  }
};
document.addEventListener('DOMContentLoaded', function () {
  if (document.body.classList.contains('pkp_page_search')) window.PIM.enhanceSearchPage(document);
});
