// ============================================
// 管理者ページロジック
// ============================================

let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {

  // 認証チェック（管理者のみ許可するロジックを追加可能）
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // 全会員一覧を取得
    try {
      const snapshot = await db.collection('members').orderBy('name').get();
      const select = document.getElementById('memberSelect');
      snapshot.forEach(doc => {
        const data = doc.data();
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = `${data.name}（${data.email}）`;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error('会員一覧取得エラー:', e);
    }
  });

  // ファイルアップロードエリア
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(212, 130, 156, 0.3)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(212, 130, 156, 0.3)';
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // フォーム送信
  document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const memberId = document.getElementById('memberSelect').value;
    if (!memberId) {
      showAdminMessage('会員を選択してください。', 'error');
      return;
    }

    const updateData = {};

    // トレーニングメニュー
    const trainingRaw = document.getElementById('trainingInput').value.trim();
    if (trainingRaw) {
      try {
        const menu = JSON.parse(trainingRaw);
        updateData.trainingMenu = menu;
      } catch {
        showAdminMessage('トレーニングメニューのJSON形式が正しくありません。', 'error');
        return;
      }
    }

    // プラン変更
    const planVal = document.getElementById('planSelect').value;
    if (planVal) {
      updateData.plan = planVal;
    }

    showAdminMessage('保存中...', 'success');

    // 画像アップロード
    if (selectedFiles.length > 0) {
      const imageUrls = [];
      for (const file of selectedFiles) {
        const ref = storage.ref(`members/${memberId}/${Date.now()}_${file.name}`);
        const snap = await ref.put(file);
        const url = await snap.ref.getDownloadURL();
        imageUrls.push(url);
      }
      updateData.images = firebase.firestore.FieldValue.arrayUnion(...imageUrls);
    }

    // Firestore更新
    if (Object.keys(updateData).length > 0) {
      try {
        await db.collection('members').doc(memberId).update(updateData);
        showAdminMessage('✅ データを保存しました！', 'success');
        selectedFiles = [];
        document.getElementById('previewGrid').innerHTML = '';
      } catch (err) {
        console.error(err);
        showAdminMessage('保存に失敗しました。', 'error');
      }
    } else {
      showAdminMessage('更新する項目がありません。', 'error');
    }
  });

  // ログアウト
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
  });
});

function handleFiles(files) {
  const grid = document.getElementById('previewGrid');
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      showAdminMessage(`${file.name} は5MBを超えています。`, 'error');
      continue;
    }
    selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('preview-thumb');
      grid.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

function showAdminMessage(text, type) {
  const el = document.getElementById('adminMessage');
  el.textContent = text;
  el.className = 'message ' + type;
}
