// Give the selected game its keyboard controls immediately after its page loads.
const frame = document.getElementById('game-frame');
frame.addEventListener('load', () => frame.contentWindow.focus());

// The Anime Launch form lives inside its page; reveal it without restarting the game.
document.querySelector('[data-account-link]')?.addEventListener('click', (event) => {
  const panel = frame.contentDocument?.getElementById('accounts');
  if (!panel) return;
  event.preventDefault();
  const gameWindow = frame.contentWindow;
  gameWindow.scrollTo({
    top: panel.getBoundingClientRect().top + gameWindow.scrollY - 16,
    behavior: 'smooth',
  });
  const form = panel.querySelector('form');
  const control = form.hidden
    ? panel.querySelector('[data-sign-out]')
    : form.querySelector('input');
  control?.focus({ preventScroll: true });
});
