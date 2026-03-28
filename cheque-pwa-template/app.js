let deferredPrompt = null;

const roleTabs = document.querySelectorAll('.role-tab');
const screens = document.querySelectorAll('.screen');
const installBtn = document.getElementById('installBtn');
const ocrPreview = document.getElementById('ocrPreview');

roleTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    roleTabs.forEach(x => x.classList.remove('active'));
    screens.forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`screen-${btn.dataset.role}`).classList.add('active');
  });
});

document.querySelector('[data-demo="ocr"]')?.addEventListener('click', () => {
  ocrPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
  ocrPreview.animate([
    { transform: 'scale(0.98)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { transform: 'scale(1.01)', boxShadow: '0 24px 48px rgba(189,75,45,.18)' },
    { transform: 'scale(1)', boxShadow: '' }
  ], { duration: 450, easing: 'ease-out' });
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}