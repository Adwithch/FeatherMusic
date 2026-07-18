// privacy.js — FeatherMusic Privacy Policy Page

const PrivacyPage = (() => {
  async function mount() {
    const view = document.getElementById('view');
    render(view);
  }

  function render(view) {
    view.innerHTML = `
      <div class="info-page fade-in">
        <section class="page-header">
          <h1 class="page-title">Privacy Policy</h1>
          <p class="page-subtitle">Your privacy and data security matter to us.</p>
        </section>

        <section class="about-section">
          <div class="info-card policy-content">
            <p>FeatherMusic stores playlists, preferences, favorites, and playback data locally on your device.</p>
            <p>FeatherMusic does not require user accounts and does not intentionally collect personal information.</p>
            <p>Media metadata, lyrics, and streaming information may be fetched from third-party services.</p>
            <p>External services may have their own privacy policies and terms.</p>
            <p>FeatherMusic does not sell user data.</p>
          </div>
        </section>
      </div>
    `;
  }

  return { mount };
})();
