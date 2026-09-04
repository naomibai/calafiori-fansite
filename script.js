/* ============================================================
   卡拉菲奥里球迷站 — 交互脚本
   功能：视频回退 / 导航高亮 / 标签切换 / 灯箱 / 图片失败回退
   ============================================================ */

/* ---------- 1. Hero 视频背景：文件缺失时回退到海报背景 ---------- */
(function () {
  var video = document.getElementById('hero-video');
  var hero = document.getElementById('hero');
  if (!video || !hero) return;

  function showFallback() {
    hero.classList.add('show-fallback');
    video.style.display = 'none';
  }

  // source 加载失败（如 assets/video/hero.mp4 不存在）时触发
  var source = video.querySelector('source');
  if (source) source.addEventListener('error', showFallback);

  // 个别浏览器在 source 上不触发 error，用超时兜底：3 秒内没开始播放就回退
  var timeout = setTimeout(function () {
    if (video.readyState < 2) showFallback();
  }, 3000);

  // 视频正常开始播放后，取消兜底定时器
  video.addEventListener('playing', function () {
    clearTimeout(timeout);
    hero.classList.remove('show-fallback');
  });
})();

/* ---------- 2. 导航栏高亮当前板块 ---------- */
(function () {
  var links = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('section[id]');
  if (!links.length || !sections.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (section) { observer.observe(section); });
})();

/* ---------- 3. 采访双点击栏切换 ---------- */
(function () {
  var buttons = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.getElementById('panel-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
})();

/* ---------- 4. 图库灯箱：点击照片放大查看 ---------- */
(function () {
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCaption = document.getElementById('lb-caption');
  if (!lightbox || !lbImg) return;

  function open(src, caption) {
    lbImg.src = src;
    lbCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden'; /* 灯箱打开时锁定页面滚动 */
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.photo img').forEach(function (img) {
    img.addEventListener('click', function () {
      if (img.dataset.full) open(img.dataset.full, img.dataset.caption);
    });
  });

  document.getElementById('lb-close').addEventListener('click', close);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close(); /* 点击图片以外区域关闭 */
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

/* ---------- 5. 图片加载失败：显示「照片待补充」占位块 ---------- */
(function () {
  document.querySelectorAll('.card-media img, .photo img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.closest('.card-media, .photo').classList.add('photo-empty');
    });
  });
})();
