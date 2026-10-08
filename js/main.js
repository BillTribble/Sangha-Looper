/**
 * Fetches the latest release from the GitHub Releases API
 * and populates the download buttons with real links.
 */
const REPO = 'BillTribble/Sangha-Looper';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

async function fetchLatestRelease() {
    const statusEl = document.getElementById('release-status');
    const standaloneBtn = document.getElementById('download-standalone');
    const vst3Btn = document.getElementById('download-vst3');
    const standaloneVersion = document.getElementById('standalone-version');
    const vst3Version = document.getElementById('vst3-version');

    try {
        const res = await fetch(API_URL);

        if (res.status === 404) {
            statusEl.innerHTML = `
                <span class="status-badge status-badge--soon">
                    <span class="status-dot status-dot--amber"></span>
                    First release coming&nbsp;soon
                </span>`;
            return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const release = await res.json();
        const assets = release.assets || [];
        const version = release.tag_name || release.name;
        const publishedAt = new Date(release.published_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Find standalone (.app or .zip containing .app)
        const standaloneAsset = assets.find(a =>
            /standalone/i.test(a.name) || /\.app/i.test(a.name)
        );

        // Find VST3
        const vst3Asset = assets.find(a =>
            /\.vst3/i.test(a.name) || /vst3/i.test(a.name)
        );

        if (standaloneAsset) {
            standaloneBtn.href = standaloneAsset.browser_download_url;
            standaloneBtn.classList.remove('download-btn--disabled');
            standaloneVersion.textContent = `${version} · ${publishedAt}`;
        }

        if (vst3Asset) {
            vst3Btn.href = vst3Asset.browser_download_url;
            vst3Btn.classList.remove('download-btn--disabled');
            vst3Version.textContent = `${version} · ${publishedAt}`;
        }

        const hasAny = standaloneAsset || vst3Asset;
        statusEl.innerHTML = hasAny
            ? `<span class="status-badge status-badge--available">
                   <span class="status-dot status-dot--green"></span>
                   ${version}&nbsp;available
               </span>`
            : `<span class="status-badge status-badge--soon">
                   <span class="status-dot status-dot--amber"></span>
                   ${version} — no downloadable assets&nbsp;yet
               </span>`;

    } catch (err) {
        console.warn('Could not fetch release info:', err);
        statusEl.innerHTML = `
            <span class="status-badge status-badge--soon">
                <span class="status-dot status-dot--amber"></span>
                First release coming&nbsp;soon
            </span>`;
    }
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Fetch releases on load
fetchLatestRelease();

const THEMES = [
    {
        name: 'teal',
        color: '#008489',
        rgb: '0, 132, 137',
        darkColor: '#57DEE3',
        darkRgb: '87, 222, 227',
        btnText: '#ffffff',
        darkBtnText: '#0a0a0f'
    },
    {
        name: 'blue',
        color: '#0066cc',
        rgb: '0, 102, 204',
        darkColor: '#6ec1ff',
        darkRgb: '110, 193, 255',
        btnText: '#ffffff',
        darkBtnText: '#0a0a0f'
    }
];

let currentThemeIndex = 0;

function setTheme(theme) {
    const root = document.documentElement;
    // Force dark mode for now
    const isDark = true;
    
    const color = isDark ? theme.darkColor : theme.color;
    const rgb = isDark ? theme.darkRgb : theme.rgb;
    const btnText = isDark ? theme.darkBtnText : theme.btnText;

    root.style.setProperty('--active-accent', color);
    root.style.setProperty('--btn-primary-text', btnText);
    root.style.setProperty('--active-accent-glow', `rgba(${rgb}, 0.25)`);
    root.style.setProperty('--active-accent-glow-hover', `rgba(${rgb}, 0.35)`);
    root.style.setProperty('--active-accent-bg-subtle', `rgba(${rgb}, 0.12)`);
    root.style.setProperty('--active-accent-bg-subtle-hover', `rgba(${rgb}, 0.2)`);
    root.style.setProperty('--active-accent-border-subtle', `rgba(${rgb}, 0.2)`);
    root.style.setProperty('--active-accent-border-glow', `rgba(${rgb}, 0.25)`);
    
    root.style.setProperty('--active-accent-orb-1', `rgba(${rgb}, 0.15)`);
    root.style.setProperty('--active-accent-orb-2', `rgba(${rgb}, 0.10)`);
    root.style.setProperty('--active-accent-orb-3', `rgba(${rgb}, 0.08)`);
    
    root.style.setProperty('--active-accent-card-start', `rgba(${rgb}, 0.08)`);
    root.style.setProperty('--active-accent-card-end', `rgba(${rgb}, 0.02)`);
    
    root.style.setProperty('--shadow-glow', isDark ? `0 0 60px rgba(${rgb}, 0.08)` : `0 20px 40px rgba(0, 0, 0, 0.05)`);
}

// Set initial Theme
setTheme(THEMES[0]);

// Handle title click
const heroTitle = document.querySelector('.hero h1');
if (heroTitle) {
    heroTitle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        setTheme(THEMES[currentThemeIndex]);
    });
}

// Listen for OS theme changes (Disabled to force dark mode)
/*
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        setTheme(THEMES[currentThemeIndex]);
    });
}
*/

// Intersection Observer for scroll reveal animations
const revealObserverOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, revealObserverOptions);

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

// Add reveal class to other sections for swish effect
document.querySelectorAll('.info-panel, .download-card, .feedback-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// Video mute/unmute control
const heroVideo = document.getElementById('hero-vid');
const unmuteBtn = document.getElementById('unmute-btn');
if (heroVideo && unmuteBtn) {
    const unmuteIcon = unmuteBtn.querySelector('.video-control-icon');
    const unmuteLabel = unmuteBtn.querySelector('.video-control-label');

    unmuteBtn.addEventListener('click', () => {
        if (heroVideo.muted) {
            heroVideo.muted = false;
            unmuteIcon.textContent = 'volume_up';
            unmuteLabel.textContent = 'Mute';
        } else {
            heroVideo.muted = true;
            unmuteIcon.textContent = 'volume_off';
            unmuteLabel.textContent = 'Unmute';
        }
    });
}
