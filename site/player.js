// Give the selected game its keyboard controls immediately after its page loads.
const frame = document.getElementById('game-frame');
frame.addEventListener('load', () => frame.contentWindow.focus());
