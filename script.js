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

/* ---------- 4. 图库灯箱：点击照片放大查看（事件委托，动态添加的照片也生效） ---------- */
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

  document.addEventListener('click', function (e) {
    var img = e.target.closest ? e.target.closest('.photo img') : null;
    if (img && img.dataset.full) open(img.dataset.full, img.dataset.caption);
  });

  document.getElementById('lb-close').addEventListener('click', close);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close(); /* 点击图片以外区域关闭 */
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

/* ---------- 5. 图片加载失败：显示占位块（事件委托，动态图也生效） ---------- */
(function () {
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || !img.matches || !img.matches('img')) return;
    var slot = img.closest('.card-media, .photo');
    if (slot) slot.classList.add('photo-empty');
    if (img.closest('.vc-cover')) img.style.display = 'none'; /* 视频封面缺失时隐藏 */
  }, true);
})();

/* ---------- 6. 采访视频：点击卡片打开 YouTube 式观看弹窗 ---------- */
(function () {
  var modal = document.getElementById('watch-modal');
  if (!modal) return;
  var player = document.getElementById('wm-video');
  var title = document.getElementById('wm-title');
  var meta = document.getElementById('wm-meta');
  var transcript = document.getElementById('wm-transcript');
  var RAW = 'https://raw.githubusercontent.com/naomibai/calafiori-fansite/main/';

  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    player.pause();
    player.removeAttribute('src');
    player.removeAttribute('poster');
    player.load();
  }

  function openCard(card) {
    title.textContent = card.dataset.title;
    meta.textContent = card.dataset.meta;
    player.poster = card.dataset.poster;
    player.src = card.dataset.video;
    /* 文字稿：动态上传的视频从云端文字稿文件读取；静态卡片用页面里的折叠条内容 */
    if (card.dataset.transcriptFile) {
      transcript.innerHTML = '<p>文字稿加载中……</p>';
      fetch(RAW + 'assets/transcripts/' + encodeURIComponent(card.dataset.transcriptFile) + '.txt')
        .then(function (r) {
          if (!r.ok) throw new Error('no transcript');
          return r.text();
        })
        .then(function (text) {
          transcript.innerHTML = text.split(/\n+/).map(function (line) {
            return '<p>' + line + '</p>';
          }).join('');
        })
        .catch(function () {
          transcript.innerHTML = '<p>（文字稿生成中，敬请期待）</p>';
        });
    } else {
      var src = document.getElementById('transcript-' + card.dataset.transcript);
      transcript.innerHTML = src
        ? src.querySelector('.ts-body').innerHTML
        : '<p>（暂无文字稿，视频上传后自动生成）</p>';
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.video-card') : null;
    if (card) openCard(card);
  });

  document.getElementById('wm-close').addEventListener('click', close);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close(); /* 点击弹窗外区域关闭 */
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

/* ---------- 7. 云端档案：自动展示新上传的照片与视频（GitHub 文件树接口） ---------- */
(function () {
  var API = 'https://api.github.com/repos/naomibai/calafiori-fansite/git/trees/HEAD?recursive=1';

  var galleryKeys = ['roma', 'basel', 'bologna', 'arsenal', 'italy', 'offpitch'];
  var galleryLabels = {
    roma: '罗马青训时期', basel: '巴塞尔时期', bologna: '博洛尼亚时期',
    arsenal: '阿森纳时期', italy: '意大利国家队', offpitch: '场外花絮'
  };

  function baseName(p) { return p.split('/').pop(); }

  fetch(API)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var paths = (data.tree || []).map(function (t) { return t.path; });
      var has = {};
      paths.forEach(function (p) { has[p] = true; });
      addNewPhotos(paths, has);
      addNewVideos(paths, has);
    })
    .catch(function () { /* 接口失败时保持静态内容不变 */ });

  /* 图库：把新上传、页面里还没有的照片追加到对应时期分组 */
  function addNewPhotos(paths, has) {
    galleryKeys.forEach(function (key) {
      var group = document.getElementById('gallery-' + key);
      if (!group) return;
      var grid = group.querySelector('.photo-grid');
      var existing = {};
      grid.querySelectorAll('img').forEach(function (img) {
        existing[baseName(img.getAttribute('src'))] = true;
      });
      var prefix = 'assets/img/' + key + '/';
      paths.filter(function (p) {
        return p.indexOf(prefix) === 0 && /\.(jpe?g|png|webp|gif)$/i.test(p);
      }).sort().forEach(function (p) {
        var name = baseName(p);
        if (existing[name]) return;
        var fig = document.createElement('figure');
        fig.className = 'photo';
        fig.innerHTML =
          '<img src="' + p + '" data-full="' + p + '" data-caption="' + galleryLabels[key] + '" alt="卡拉菲奥里 · ' + galleryLabels[key] + '" loading="lazy">' +
          '<div class="photo-missing"><span class="pm-letter">+</span><span class="pm-text">照片待补充</span>' +
          '<span class="pm-path">' + p + '</span></div>' +
          '<figcaption>' + galleryLabels[key] + '</figcaption>';
        grid.appendChild(fig);
      });
    });
  }

  /* 采访：把新上传的 mp4 追加为视频卡片（文字稿在 assets/transcripts/ 下同名 .txt） */
  function addNewVideos(paths, has) {
    var list = document.querySelector('.interview-videos');
    if (!list) return;
    var existing = {};
    list.querySelectorAll('.video-card').forEach(function (c) {
      existing[baseName(c.dataset.video)] = true;
    });
    var prefix = 'assets/video/interviews/';
    paths.filter(function (p) {
      return p.indexOf(prefix) === 0 && /\.mp4$/i.test(p);
    }).sort().forEach(function (p) {
      var name = baseName(p);
      if (existing[name]) return;
      var key = name.replace(/\.mp4$/i, '');
      var cover = 'assets/img/covers/' + key + '.jpg';
      if (!has[cover]) cover = '';
      var card = document.createElement('article');
      card.className = 'video-card';
      card.dataset.video = p;
      card.dataset.poster = cover;
      card.dataset.title = '新上传采访（标题待定）';
      card.dataset.meta = '云端上传 · 待整理';
      card.dataset.transcriptFile = key;
      card.innerHTML =
        '<div class="vc-cover">' +
          (cover ? '<img src="' + cover + '" alt="采访封面" loading="lazy">' : '') +
          '<span class="vc-play">▶</span>' +
        '</div>' +
        '<div class="vc-info">' +
          '<h4 class="vc-title">新上传采访（标题待定）</h4>' +
          '<p class="vc-meta">云端上传 · 待整理</p>' +
          '<p class="vc-desc">点击观看 · 中文文字稿生成中</p>' +
        '</div>';
      list.appendChild(card);
    });
  }
})();
