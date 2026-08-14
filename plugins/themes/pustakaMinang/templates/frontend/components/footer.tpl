{**
 * plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl
 *
 * Copyright (c) 2014-2021 Simon Fraser University
 * Copyright (c) 2003-2021 John Willinsky
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * Custom site frontend footer for pustakaMinang theme.
 *}
{strip}
	{assign var="pimFooterPublicJournalLayout" value=false}
	{if $currentContext && $requestedPage != 'user' && $requestedPage != 'login' && $requestedPage != 'management' && $requestedPage != 'dashboard' && $requestedPage != 'admin'}
		{assign var="pimFooterPublicJournalLayout" value=true}
	{/if}
{/strip}
	</div><!-- pkp_structure_main -->

	{* Sidebars - always keep the right rail on public journal pages. *}
	{if $currentContext && $pimFooterPublicJournalLayout}
		{capture assign="sidebarCode"}{call_hook name="Templates::Common::Sidebar"}{/capture}
		{capture assign="pimFilteredSidebarCode"}{$sidebarCode|pim_remove_duplicate_editorial_team}{/capture}
		{if $pimFilteredSidebarCode|trim}
			<div class="pkp_structure_sidebar left pim-journal-sidebar" id="pimJournalLinksPanel" role="complementary" aria-label="{translate|escape key="common.navigation.sidebar"}">
				{$pimFilteredSidebarCode}
			</div><!-- pim-journal-sidebar -->
		{/if}
	{/if}

</div><!-- pkp_structure_content -->

<footer class="footer pkp_structure_footer_wrapper" role="contentinfo">
  <div class="pim-container">
    <div class="footer-topline">
      <div>
        <span class="footer-kicker">Pustaka Inspirasi Minang</span>
        <strong>Peer-reviewed journal publishing and open access scholarly communication.</strong>
      </div>
    </div>
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo-mark">
          {if $displayPageHeaderLogo}
            <img src="{$publicFilesDir}/{$displayPageHeaderLogo.uploadName|escape:"url"}" alt="Pustaka Inspirasi Minang" loading="lazy" decoding="async" style="max-height: 50px; width: auto; object-fit: contain;">
          {else}
            <img src="{$baseUrl}/logo.png" alt="Pustaka Inspirasi Minang" loading="lazy" decoding="async" style="max-height: 50px; width: auto; object-fit: contain;">
          {/if}
        </div>
        <h3>PIM Journal Portal</h3>
        <p>Pustaka Inspirasi Minang supports open access journals, rigorous peer review, and long-term scholarly archiving across biological, chemical, computer, mathematical, and physical sciences.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul class="footer-links-list">
          <li><a href="{$baseUrl}/">Home</a></li>
          <li><a href="{url router=$smarty.const.ROUTE_PAGE page="index"}">Journals</a></li>
          <li><a href="{url page="about"}">About Us</a></li>
          <li><a href="{url page="about" op="submissions"}">Guidelines</a></li>
          <li><a href="{url page="about" op="contact"}">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact Info</h4>
        <div class="footer-contact-item footer-contact-item--address">
          <i class="fas fa-map-marker-alt"></i>
          <span>Padang, West Sumatra, Indonesia</span>
        </div>
        <div class="footer-contact-item">
          <i class="fas fa-envelope"></i>
          <span>Editorial Office: <a href="mailto:admin@pustakainspirasi.com">admin@pustakainspirasi.com</a></span>
        </div>
        <div class="footer-contact-item footer-contact-support">
          <i class="fas fa-life-ring"></i>
          <span>Technical Support: <a href="https://wa.me/6285365202765" target="_blank" rel="noopener">For technical assistance only</a></span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 <a href="https://journal.pustakainspirasi.com">Pustaka Inspirasi Minang</a>. All rights reserved.</span>
      {assign var="pimLicenseUrl" value=""}
      {if $currentContext}
        {assign var="pimLicenseUrl" value=$currentContext->getData('licenseUrl')}
      {/if}
      {if $pimLicenseUrl && $pimLicenseUrl != 'on'}
        <span>Open access license: <a href="{$pimLicenseUrl|escape}" target="_blank" rel="noopener">view license terms</a>.</span>
      {else}
        <span>License information is provided with each published work.</span>
      {/if}
    </div>
  </div>
</footer>

</div><!-- pkp_structure_page -->

<script src="{$baseUrl}/pim-ui.js"></script>

{load_script context="frontend"}

{if !$pimFooterPublicJournalLayout}
	{call_hook name="Templates::Common::Footer::PageFooter"}
{/if}
</body>
</html>
