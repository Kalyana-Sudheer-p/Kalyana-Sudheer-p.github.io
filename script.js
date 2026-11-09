const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-nav]');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 24);
}

menuToggle.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const hero = document.querySelector('.hero');
const flowFrame = document.querySelector('[data-flow-frame]');
let flowTicking = false;
let lastScrollY = window.scrollY;

function updateFlow() {
  if (!flowFrame || !hero) return;
  const range = Math.max(hero.offsetHeight * 0.72, 1);
  const progress = Math.min(1, Math.max(0, window.scrollY / range));
  const direction = window.scrollY >= lastScrollY ? 1 : -1;
  lastScrollY = window.scrollY;
  flowFrame.contentWindow?.postMessage({ type: 'pipeline-progress', progress, direction }, window.location.origin);
  flowTicking = false;
}

function requestFlowUpdate() {
  if (!flowTicking) {
    window.requestAnimationFrame(updateFlow);
    flowTicking = true;
  }
}

if (flowFrame) {
  flowFrame.addEventListener('load', updateFlow);
  window.addEventListener('scroll', requestFlowUpdate, { passive: true });
  window.addEventListener('resize', requestFlowUpdate);
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const cloudTabs = Array.from(document.querySelectorAll('[data-cloud-tab]'));
const cloudPanels = Array.from(document.querySelectorAll('[data-cloud-panel]'));

function selectCloudTab(selectedTab) {
  const selectedCloud = selectedTab.dataset.cloudTab;
  cloudTabs.forEach((tab) => {
    const active = tab === selectedTab;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  cloudPanels.forEach((panel) => {
    panel.hidden = panel.dataset.cloudPanel !== selectedCloud;
  });
  selectedTab.focus();
}

cloudTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCloudTab(tab));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % cloudTabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + cloudTabs.length) % cloudTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = cloudTabs.length - 1;
    else return;
    event.preventDefault();
    selectCloudTab(cloudTabs[next]);
  });
});
