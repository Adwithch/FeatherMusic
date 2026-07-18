// about.js — FeatherMusic About Page

const AboutPage = (() => {
  async function mount() {
    const view = document.getElementById('view');
    render(view);
  }

  function render(view) {
    view.innerHTML = `
      <div class="info-page fade-in">
        <section class="about-header">
          <div class="about-logo-container">
            <i data-lucide="feather" class="about-logo-icon"></i>
          </div>
          <h1 class="about-title">FeatherMusic</h1>
          <p class="about-tagline">Lightweight immersive desktop music experience.</p>
          <div class="about-version">v1.0 Beta</div>
        </section>

        <section class="about-section">
          <h2 class="section-title">Description</h2>
          <div class="info-card">
            <p>FeatherMusic is a modern lightweight desktop music player focused on immersive playback, synced lyrics, and smooth user experience. It brings your favorite music to your desktop with a minimal yet powerful interface.</p>
          </div>
        </section>

        <section class="about-section">
          <h2 class="section-title">Technologies Used</h2>
          <div class="tech-grid">
            <div class="tech-chip"><i data-lucide="zap"></i> Neutralino.js</div>
            <div class="tech-chip"><i data-lucide="code-2"></i> Vanilla JavaScript</div>
            <div class="tech-chip"><i data-lucide="music"></i> LRCLIB</div>
            <div class="tech-chip"><i data-lucide="globe"></i> Invidious APIs</div>
          </div>
        </section>

        <section class="about-section">
          <h2 class="section-title">Developer</h2>
          <div class="developer-card">
            <div class="dev-info">
              <h3>Adwith</h3>
              <p>Lead Developer & Designer</p>
            </div>
            <div class="social-links">
              <a href="https://instagram.com/a.dwith" class="social-btn instagram" onclick="openExternal(event, this.href)">
                <i data-lucide="instagram"></i>
                <span>Instagram</span>
              </a>
              <a href="https://github.com/adwithch" class="social-btn github" onclick="openExternal(event, this.href)">
                <i data-lucide="github"></i>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </section>

        <section class="about-section">
          <h2 class="section-title">Credits</h2>
          <div class="info-card">
            <ul class="credits-list">
              <li><strong>Open-source:</strong> NeutralinoJS, Lucide Icons, DM Sans Font</li>
              <li><strong>APIs:</strong> Invidious (Video/Audio), LRCLIB (Lyrics)</li>
              <li><strong>Icons:</strong> Lucide Contributors</li>
            </ul>
          </div>
        </section>

        <footer class="about-footer">
          <p>Made with ❤️ by Adwith</p>
        </footer>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { mount };
})();

// Helper to open links in external browser
function openExternal(e, url) {
  e.preventDefault();
  if (typeof Neutralino !== 'undefined') {
    Neutralino.os.open(url);
  } else {
    window.open(url, '_blank');
  }
}
