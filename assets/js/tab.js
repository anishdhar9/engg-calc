export function switchTab(tab, buttonEl) {
  document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const activeButton = buttonEl || window.event?.target;
  if (activeButton) activeButton.classList.add('active');
}
