/** 横屏布局：竖屏时旋转 90° 强制横屏 */
export function initOrientation() {
  handleOrientation();
  window.addEventListener('resize', handleOrientation);
  if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientation);
  } else {
    window.addEventListener('orientationchange', handleOrientation);
  }
}

function handleOrientation() {
  const c = document.getElementById('game-container');
  if (!c) return;

  let type = '';
  if (screen.orientation?.type) {
    type = screen.orientation.type;
  } else {
    type = window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait-primary';
  }

  if (type === 'portrait-primary' || type === 'portrait-secondary') {
    c.style.width = '100vh';
    c.style.height = '100vw';
    c.style.left = '50%';
    c.style.top = '50%';
    c.style.transform = 'translate(-50%,-50%) rotate(90deg)';
  } else if (type === 'landscape-secondary') {
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.left = '0';
    c.style.top = '0';
    c.style.transform = 'rotate(180deg)';
  } else {
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.left = '0';
    c.style.top = '0';
    c.style.transform = '';
  }
}
