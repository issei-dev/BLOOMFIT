// ============================================
// ダッシュボードロジック
// ============================================

const planData = {
  light: {
    icon: '🌱',
    name: 'ライトプラン',
    price: '¥19,800/月',
    detail: '月4回 / 1回50分\nパーソナルトレーニング\n食事アドバイス（テキスト）'
  },
  standard: {
    icon: '🌸',
    name: 'スタンダードプラン',
    price: '¥34,800/月',
    detail: '月8回 / 1回50分\nパーソナルトレーニング\n食事管理サポート\nLINE相談無制限'
  },
  premium: {
    icon: '👑',
    name: 'プレミアムプラン',
    price: '¥54,800/月',
    detail: '通い放題 / 1回60分\nパーソナルトレーニング\n完全食事管理\nLINE相談無制限\nボディケア月2回'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');

  // 認証チェック
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    try {
      // Firestoreからデータ取得
      const doc = await db.collection('members').doc(user.uid).get();

      if (doc.exists) {
        const data = doc.data();
        renderMemberInfo(data);
        renderPlan(data.plan);
        renderTraining(data.trainingMenu || []);
        renderGallery(data.images || []);
      }

      loading.style.display = 'none';
    } catch (error) {
      console.error('データ取得エラー:', error);
      loading.style.display = 'none';
    }
  });

  // ログアウト
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
  });

  // ライトボックス
  document.getElementById('lightbox').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('active');
  });
});

function renderMemberInfo(data) {
  document.getElementById('navUserName').textContent = data.name + ' 様';
  document.getElementById('welcomeName').textContent = data.name;
  document.getElementById('infoName').textContent = data.name;
  document.getElementById('infoEmail').textContent = data.email;
  document.getElementById('infoPhone').textContent = data.phone || '未登録';

  if (data.createdAt) {
    const date = data.createdAt.toDate();
    document.getElementById('infoDate').textContent =
      date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
  }
}

function renderPlan(planKey) {
  const plan = planData[planKey] || planData.light;
  const display = document.getElementById('planDisplay');
  display.innerHTML = `
    <div class="plan-icon">${plan.icon}</div>
    <div class="plan-name">${plan.name}</div>
    <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary); margin: 4px 0;">${plan.price}</div>
    <div class="plan-detail">${plan.detail.replace(/\n/g, '<br>')}</div>
  `;
}

function renderTraining(menu) {
  const container = document.getElementById('trainingList');
  if (!menu || menu.length === 0) return;

  container.innerHTML = menu.map((item, i) => `
    <div class="training-item">
      <div class="training-number">${i + 1}</div>
      <div class="training-content">
        <div class="training-name">${item.name}</div>
        <div class="training-detail">${item.sets || ''} ${item.note || ''}</div>
      </div>
    </div>
  `).join('');
}

function renderGallery(images) {
  const container = document.getElementById('gallery');
  if (!images || images.length === 0) return;

  container.innerHTML = images.map(url => `
    <div class="gallery-item" onclick="openLightbox('${url}')">
      <img src="${url}" alt="トレーニング記録" loading="lazy">
    </div>
  `).join('');
}

function openLightbox(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('active');
}
