/**
 * Altrium App Footer — self-contained widget.
 *
 * Usage: add ONE line before </body> on any page:
 *
 *   <script src="js/footer.js"></script>
 *
 * No HTML markup or separate CSS file needed — this creates its own
 * footer element (appended at the very end of the page) and its own
 * <style> block, styled to match the app's existing navy/gold theme.
 */
(function () {
  const style = document.createElement("style");
  style.textContent = `
    #altrium-app-footer {
      background: #16324f;
      color: #cbd5e1;
      font-family: "Poppins", "Segoe UI", Arial, sans-serif;
      padding: 40px 32px 24px;
      margin-top: 40px;
    }
    #altrium-app-footer .altrium-footer-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 32px;
      max-width: 1100px;
      margin: 0 auto;
    }
    #altrium-app-footer .altrium-footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    #altrium-app-footer .altrium-footer-brand span {
      font-weight: 700;
      font-size: 1.15rem;
      color: #fff;
      text-transform: lowercase;
    }
    #altrium-app-footer .altrium-footer-tagline {
      font-size: 0.82rem;
      color: #9fb3c8;
      margin: 0;
      max-width: 260px;
    }
    #altrium-app-footer h6 {
      color: #f6b93b;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
    }
    #altrium-app-footer ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #altrium-app-footer ul li {
      margin-bottom: 8px;
      font-size: 0.85rem;
    }
    #altrium-app-footer a {
      color: #cbd5e1;
      text-decoration: none;
    }
    #altrium-app-footer a:hover {
      color: #f6b93b;
      text-decoration: underline;
    }
    #altrium-app-footer .altrium-footer-bottom {
      max-width: 1100px;
      margin: 28px auto 0;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 0.78rem;
      color: #8ba0b8;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    @media (max-width: 767.98px) {
      #altrium-app-footer .altrium-footer-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }
  `;
  document.head.appendChild(style);

  // Links adapt slightly by role, if we can tell who's logged in — falls
  // back to generic links if sessionStorage isn't set (e.g. on the
  // login page itself).
  const role = sessionStorage.getItem("role");
  const dashboardByRole = {
    HR: "hr-dashboard.html",
    HIRING_MANAGER: "hiring-manager-dashboard.html",
    INTERVIEWER: "interviewer-dashboard.html",
  };
  const dashboardLink = dashboardByRole[role] || "login.html";

  const footer = document.createElement("footer");
  footer.id = "altrium-app-footer";
  footer.innerHTML = `
    <div class="altrium-footer-grid">
      <div>
        <div class="altrium-footer-brand">
         <img src="../images/logo.png" alt="Altrium logo" width="26" height="29">
          <span>altrium</span>
        </div>
        <p class="altrium-footer-tagline">Recruitment and hiring tracker — built to keep HR, Hiring Managers, and Interviewers in sync throughout the pipeline.</p>
      </div>

      <div>
        <h6>Quick Links</h6>
        <ul>
          <li><a href="${dashboardLink}">Dashboard</a></li>
          <li><a href="login.html">Login</a></li>
          <li><a href="forgot-password.html">Forgot Password</a></li>
        </ul>
      </div>

      <div>
        <h6>Support</h6>
        <ul>
          <li><a href="mailto:support@altrium.internal">Contact IT Support</a></li>
          <li><a href="mailto:hr@altrium.internal">Contact HR</a></li>
        </ul>
      </div>
    </div>

    <div class="altrium-footer-bottom">
      <span>&copy; ${new Date().getFullYear()} Altrium Recruitment System. All rights reserved.</span>
      <span>Internal use only</span>
    </div>
  `;

  document.body.appendChild(footer);
})();
