document.addEventListener('DOMContentLoaded', function() {
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function() {
      mainNav.classList.toggle('open');
    });
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


  var mobileToolsToggle = document.getElementById('pimMobileToolsToggle');
  var mobileToolsTabs = document.querySelectorAll('[data-pim-tools-tab]');
  var mobileToolsClosers = document.querySelectorAll('[data-pim-tools-close]');
  var mobileToolsQuery = window.matchMedia ? window.matchMedia('(max-width: 767.98px)') : null;

  function isMobileToolsViewport() {
    return mobileToolsQuery ? mobileToolsQuery.matches : window.innerWidth <= 768;
  }

  function setMobileToolsTab(tab) {
    var selected = tab === 'links' ? 'links' : 'menu';
    document.body.classList.toggle('pim-tools-tab-menu', selected === 'menu');
    document.body.classList.toggle('pim-tools-tab-links', selected === 'links');
    mobileToolsTabs.forEach(function(button) {
      var active = button.getAttribute('data-pim-tools-tab') === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function openMobileTools(tab) {
    if (!mobileToolsToggle || !isMobileToolsViewport()) return;
    setMobileToolsTab(tab || (document.body.classList.contains('pim-tools-tab-links') ? 'links' : 'menu'));
    document.body.classList.add('pim-tools-open');
    mobileToolsToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMobileTools() {
    document.body.classList.remove('pim-tools-open');
    if (mobileToolsToggle) mobileToolsToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobileToolsToggle) {
    setMobileToolsTab('menu');
    mobileToolsToggle.addEventListener('click', function() {
      if (document.body.classList.contains('pim-tools-open')) {
        closeMobileTools();
      } else {
        openMobileTools();
      }
    });
  }

  mobileToolsTabs.forEach(function(button) {
    button.addEventListener('click', function() {
      var tab = button.getAttribute('data-pim-tools-tab') || 'menu';
      if (document.body.classList.contains('pim-tools-open')) {
        setMobileToolsTab(tab);
      } else {
        openMobileTools(tab);
      }
    });
  });

  mobileToolsClosers.forEach(function(closer) {
    closer.addEventListener('click', closeMobileTools);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMobileTools();
  });

  window.addEventListener('resize', function() {
    if (!isMobileToolsViewport()) closeMobileTools();
  });

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
  removeRawMarketingFooterBlocks();
  relabelPublicSubmitButtons();
  extractJournalHomepageWidgets();
  handleBrokenImages();
});
