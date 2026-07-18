// legal.js — FeatherMusic Legal / Disclaimer Page

const LegalPage = (() => {
  async function mount() {
    const view = document.getElementById('view');
    render(view);
  }

  function render(view) {
    view.innerHTML = `
      <div class="info-page fade-in">
        <section class="page-header">
          <h1 class="page-title">Legal / Disclaimer</h1>
          <p class="page-subtitle">Terms of use and legal information.</p>
        </section>

        <section class="about-section">
          <div class="info-card policy-content">
            <h3 style="margin-bottom: 12px; color: var(--accent);">Disclaimer</h3>
            <p>FeatherMusic is an independent open-source music client.</p>
            <p>FeatherMusic does not host, store, or distribute copyrighted media content.</p>
            <p>All media content is provided by third-party services and remains the property of their respective owners.</p>
            <p>Users are responsible for complying with local copyright laws and platform terms of service.</p>
            <p>FeatherMusic is intended for educational and personal use only.</p>
          </div>
        </section>
      </div>
    `;
  }

  return { mount };
})();
