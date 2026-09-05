/**
 * Altrium Mobile Nav Toggle — self-contained widget.
 *
 * Usage: add ONE line before </body> on any page with a sidebar:
 *
 *   <script src="js/mobile-nav.js"></script>
 *
 * Injects a hamburger button into the sidebar (visible only at mobile
 * widths, via CSS) that shows/hides the nav links. No HTML changes
 * needed on the page itself.
 */
(function () {
  const sidebar = document.querySelector(".sidebar");
  const nav = document.querySelector(".sidebar-nav");
  if (!sidebar || !nav) return;

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "mobile-nav-toggle";
  toggleBtn.setAttribute("aria-label", "Toggle menu");
  toggleBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
    <span>Menu</span>
  `;

  const logo = sidebar.querySelector(".sidebar-logo");
  if (logo && logo.nextSibling) {
    sidebar.insertBefore(toggleBtn, logo.nextSibling);
  } else {
    sidebar.insertBefore(toggleBtn, nav);
  }

  toggleBtn.addEventListener("click", () => {
    nav.classList.toggle("mobile-nav-open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("mobile-nav-open");
    });
  });
})();