// ============================================
// 認証ロジック
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // --- パーティクル背景生成 ---
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      const size = Math.random() * 20 + 5;
      const colors = ['#e8a0bf', '#f0c4d4', '#a8d5ba', '#f4c88c', '#d4c4e8'];
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 10 + 's';
      p.style.animationDuration = (Math.random() * 15 + 10) + 's';
      particlesContainer.appendChild(p);
    }
  }

  // --- タブ切り替え ---
  const tabs = document.querySelectorAll('.tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById(target + 'Form').classList.add('active');
      hideMessage();
    });
  });

  // --- パスワード強度 ---
  const regPassword = document.getElementById('regPassword');
  if (regPassword) {
    regPassword.addEventListener('input', (e) => {
      const val = e.target.value;
      const bar = document.querySelector('.strength-bar');
      let strength = 0;
      if (val.length >= 8) strength += 25;
      if (/[A-Z]/.test(val)) strength += 25;
      if (/[0-9]/.test(val)) strength += 25;
      if (/[^A-Za-z0-9]/.test(val)) strength += 25;

      bar.style.width = strength + '%';
      if (strength <= 25) bar.style.background = '#e74c3c';
      else if (strength <= 50) bar.style.background = '#f39c12';
      else if (strength <= 75) bar.style.background = '#3498db';
      else bar.style.background = '#2ecc71';
    });
  }

  // --- ログイン処理 ---
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      showMessage('ログイン中...', 'success');
      await auth.signInWithEmailAndPassword(email, password);
      showMessage('ログイン成功！リダイレクトします...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      console.error(error);
      let msg = 'ログインに失敗しました。';
      if (error.code === 'auth/user-not-found') msg = 'アカウントが見つかりません。';
      if (error.code === 'auth/wrong-password') msg = 'パスワードが正しくありません。';
      if (error.code === 'auth/invalid-email') msg = 'メールアドレスの形式が正しくありません。';
      showMessage(msg, 'error');
    }
  });

  // --- 新規登録処理 ---
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const plan = document.querySelector('input[name="plan"]:checked').value;

    if (password !== passwordConfirm) {
      showMessage('パスワードが一致しません。', 'error');
      return;
    }

    if (password.length < 8) {
      showMessage('パスワードは8文字以上にしてください。', 'error');
      return;
    }

    try {
      showMessage('アカウント作成中...', 'success');
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Firestoreにユーザー情報保存
      await db.collection('members').doc(user.uid).set({
        name: name,
        email: email,
        phone: phone,
        plan: plan,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        trainingMenu: [],
        images: []
      });

      showMessage('登録完了！ダッシュボードへ移動します...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      let msg = '登録に失敗しました。';
      if (error.code === 'auth/email-already-in-use') msg = 'このメールアドレスは既に登録されています。';
      if (error.code === 'auth/weak-password') msg = 'パスワードが弱すぎます。';
      showMessage(msg, 'error');
    }
  });

  // --- パスワードリセット ---
  document.getElementById('forgotPassword')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    if (!email) {
      showMessage('メールアドレスを入力してからクリックしてください。', 'error');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      showMessage('パスワードリセットメールを送信しました。', 'success');
    } catch (error) {
      showMessage('メールの送信に失敗しました。', 'error');
    }
  });

  // --- 認証状態監視（ログイン済みならリダイレクト） ---
  auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.endsWith('index.html')) {
      window.location.href = 'dashboard.html';
    }
  });
});

// --- メッセージ表示ユーティリティ ---
function showMessage(text, type) {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = 'message ' + type;
}

function hideMessage() {
  const msgEl = document.getElementById('message');
  msgEl.className = 'message';
  msgEl.textContent = '';
}
