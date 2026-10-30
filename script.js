// よくある質問：アコーディオンの開閉アニメーション
// 動き自体は style.css の transition。ここでは is-open クラスの付け外しと、
// 閉じるアニメーションが終わってから details を閉じる制御だけを行う。
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#faq details').forEach((details) => {
    const summary = details.querySelector('summary');
    const wrap = details.querySelector('.answer-wrap');
    const close = () => {
      if (!details.classList.contains('is-open')) details.open = false;
    };

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      if (details.classList.contains('is-open')) {
        // 閉じる：先に縮めて、終わったら details を閉じる
        details.classList.remove('is-open');
        // transition が起きない環境（動きを減らす設定など）向けの保険
        clearTimeout(details._closeTimer);
        details._closeTimer = setTimeout(close, 400);
      } else {
        // 開く：details を開き、閉じた状態を一度描画させてから広げる
        clearTimeout(details._closeTimer);
        details.open = true;
        void wrap.offsetHeight;
        details.classList.add('is-open');
      }
    });

    wrap.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'grid-template-rows') close();
    });
  });
});

// ---------- 動き ----------
// 動きを減らす設定の人には、フェードイン・カウントアップ・パララックスを出さない
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// スクロールで入ってきた要素をふわっと表示
document.addEventListener('DOMContentLoaded', () => {
  if (REDUCE_MOTION || !('IntersectionObserver' in window)) return;

  // 1つずつ表示する要素
  const singles = [
    '.hero-text > *', '.hero-bottom > *', '.eyebrow', '.h2', '.band',
    '.profile-photo', '.profile > div:last-child',
    '.voices-note', '.cta-block', '.price-note', '.faq-group',
    '.closing-photo', '.closing-text',
  ];
  // 並んでいるカードは、少しずつ時間差で表示
  const groups = ['.features', '.stats', '.voices', '.price-cards', '.steps'];

  const targets = [];
  document.querySelectorAll(singles.join(',')).forEach((el) => {
    // FVは読み込み直後に上から順に表示
    const hero = el.closest('.hero');
    if (hero) {
      const order = [...hero.querySelectorAll('.hero-text > *, .hero-bottom > *')].indexOf(el);
      el.style.setProperty('--d', `${order * 0.12}s`);
    }
    targets.push(el);
  });
  document.querySelectorAll(groups.join(',')).forEach((group) => {
    // 料金は「体験 → 続けたい方は → 正規」の順が伝わるよう、間隔を広げる
    const step = group.classList.contains('price-cards') ? 0.4 : 0.12;
    [...group.children].forEach((el, i) => {
      el.style.setProperty('--d', `${i * step}s`);
      targets.push(el);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // 表示し終わったらクラスを外す（ボタンのホバーなど、元の動きに戻すため）
      el.addEventListener('transitionend', () => {
        el.classList.remove('js-reveal', 'is-in');
        el.style.removeProperty('--d');
      }, { once: true });
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  targets.forEach((el) => {
    el.classList.add('js-reveal');
    io.observe(el);
  });
});

// 数字のカウントアップ（data-count の値まで）
document.addEventListener('DOMContentLoaded', () => {
  const els = document.querySelectorAll('[data-count]');
  if (REDUCE_MOTION || !('IntersectionObserver' in window)) return;

  // 一桁の数字は全角で表示する（ページ全体の表記ルールに合わせる）
  const format = (n) => (n < 10 ? String.fromCharCode(0xff10 + n) : String(n));
  const DURATION = 1200;

  const run = (el) => {
    const end = Number(el.dataset.count);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3); // 最後にゆっくり止まる
      el.textContent = format(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // 描画が止まる環境（タブが裏にある等）でも、最後は必ず最終値にする
    setTimeout(() => { el.textContent = format(end); }, DURATION + 100);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  els.forEach((el) => {
    el.textContent = format(0);
    io.observe(el);
  });
});

// パララックス：写真や背景の円をスクロールより少しゆっくり動かす
document.addEventListener('DOMContentLoaded', () => {
  if (REDUCE_MOTION) return;
  const imgs = document.querySelectorAll('[data-parallax]');
  const vars = document.querySelectorAll('[data-parallax-var]');
  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    imgs.forEach((el) => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      // 枠の中心が画面の中心からどれだけずれているか
      const offset = box.top + box.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${offset * -Number(el.dataset.parallax)}px, 0)`;
    });
    vars.forEach((el) => {
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      const offset = box.top + box.height / 2 - vh / 2;
      el.style.setProperty('--py', (offset * -Number(el.dataset.parallaxVar)).toFixed(1));
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
});

// スマホの追従ボタン：FVのボタンが見えている間は隠す（同じボタンが2つ並ばないように）
document.addEventListener('DOMContentLoaded', () => {
  const heroCta = document.querySelector('.hero-cta');
  if (!heroCta || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('is-hero-cta-visible', entry.isIntersecting);
  }).observe(heroCta);
});

// 体験レッスンの流れ：ブロックのフェードインに合わせて、棒を左から右（スマホは上から下）へ伸ばす
document.addEventListener('DOMContentLoaded', () => {
  if (REDUCE_MOTION || !('IntersectionObserver' in window)) return;
  const steps = document.querySelector('.steps');
  if (!steps) return;
  steps.classList.add('js-line');
  const vertical = window.matchMedia('(max-width: 840px)');

  // 横並び：ブロックが出そろうタイミングで、棒を左から右へ
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    steps.classList.add('is-line-in');
    io.disconnect();
  }, { rootMargin: '0px 0px -10% 0px' });
  io.observe(steps);

  // 縦並び：ブロックが1つ表示されるたびに、そのブロックの下端まで棒を伸ばす
  // （棒だけが先に下まで見えてしまわないように）
  const items = [...steps.children];
  let shown = 0;
  const update = () => {
    if (!vertical.matches) return;
    const last = items[shown - 1];
    const h = last ? last.offsetTop + last.offsetHeight : 0;
    steps.style.setProperty('--line-h', `${h}px`);
  };
  const stepIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      shown = Math.max(shown, items.indexOf(entry.target) + 1);
      stepIo.unobserve(entry.target);
    });
    update();
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach((el) => stepIo.observe(el));
  window.addEventListener('resize', update);
});

// プロフィール写真の円のふち：画面に入ったら、真上から時計回りにぐるっと描く
document.addEventListener('DOMContentLoaded', () => {
  // @property に対応していないブラウザでは、最初から円を表示したままにする
  if (REDUCE_MOTION || !('IntersectionObserver' in window) || !(window.CSS && 'registerProperty' in CSS)) return;
  const photo = document.querySelector('.profile-photo');
  if (!photo) return;
  photo.classList.add('js-ring');
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    photo.classList.add('is-ring-in');
    io.disconnect();
  }, { threshold: 0.4 });
  io.observe(photo);
});
