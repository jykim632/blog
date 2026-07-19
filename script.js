const button = document.querySelector('.theme-button');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(isNight) {
  document.body.classList.toggle('night', isNight);
  button.setAttribute('aria-pressed', String(isNight));
  button.setAttribute('aria-label', isNight ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
  button.querySelector('.theme-label').textContent = isNight ? 'Day' : 'Night';
}

setTheme(localStorage.getItem('theme') ? localStorage.getItem('theme') === 'night' : prefersDark.matches);
button.addEventListener('click', () => {
  const isNight = !document.body.classList.contains('night');
  setTheme(isNight);
  localStorage.setItem('theme', isNight ? 'night' : 'day');
});

const progress = document.querySelector('.reading-progress span');
if (progress) {
  const updateProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${height > 0 ? (window.scrollY / height) * 100 : 0}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
}
