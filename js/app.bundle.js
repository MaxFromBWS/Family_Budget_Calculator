// ES module: shared application state and constants

const STORAGE_KEY = 'familyBudgetFinalV1';
const THEME_KEY = 'familyBudgetFinalThemeV1';
const AUTH_USERS_KEY = 'familyBudgetAuthUsersV1';
const AUTH_SESSION_KEY = 'familyBudgetAuthSessionV1';
const AUTH_REMEMBER_KEY = 'familyBudgetAuthRememberV2';
const ONBOARDING_KEY = 'familyBudgetOnboardingSeenV1';
const AUTOSAVE_DELAY = 700;

const state = {
  editingExpenseId: null,
  editingDailyIncomeId: null,
  selectedDay: '',
  authMode: 'login',
  authView: 'auth',
  authState: {
    userEmail: null
  },
  autosaveTimer: null,
  appData: {
    settings: {
      selectedMonth: '',
      familyMembers: 1,
      defaultIncomePlan: 0,
      defaultExpensePlan: 0
    },
    incomes: [],
    monthlyExpenses: [],
    expenses: [],
    dailyIncomes: [],
    categoryLimits: [],
    recurringRules: [],
    monthHistory: [],
    goals: [],
    reserveFund: {
      target: 0,
      current: 0,
      monthlyContribution: 0
    }
  }
};


// ES module bootstrap for the family budget calculator
const HANDLERS = {};

function createEmptyAppData() {
  return {
    settings: {
      selectedMonth: getCurrentMonthValue(),
      familyMembers: 1,
      defaultIncomePlan: 0,
      defaultExpensePlan: 0
    },
    incomes: [],
    monthlyExpenses: [],
    expenses: [],
    dailyIncomes: [],
    categoryLimits: [],
    recurringRules: [],
    monthHistory: [],
    goals: [],
    reserveFund: {
      target: 0,
      current: 0,
      monthlyContribution: 0
    }
  };
}

/* ===== common.js ===== */
/* Файл: common.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       11. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
       ========================================================= */
    function formatMoney(amount) {
      const safeNumber = Number(amount) || 0;
      return safeNumber.toLocaleString('ru-RU') + ' ₽';
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }

    function getCurrentMonthValue() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    function fillToday() {
      const now = new Date();
      document.getElementById('expenseDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function monthFromDate(dateStr) {
      return (dateStr || '').slice(0, 7);
    }

    function getSelectedMonth() {
      return document.getElementById('selectedMonth').value || getCurrentMonthValue();
    }

    function getMonthLabel(monthKey) {
      if (!monthKey) return '—';
      const [year, month] = monthKey.split('-');
      const monthNames = [
        'Январь','Февраль','Март','Апрель','Май','Июнь',
        'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
      ];
      return `${monthNames[Number(month) - 1]} ${year}`;
    }

    function getISOWeekLabel(dateString) {
      const date = new Date(dateString);
      const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNumber = target.getUTCDay() || 7;
      target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
      const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
      return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    function getMonthRecord(monthKey) {
      return state.appData.monthHistory.find(item => item.month === monthKey);
    }

    function upsertMonthHistoryRecord(record) {
      const index = state.appData.monthHistory.findIndex(item => item.month === record.month);
      if (index >= 0) {
        state.appData.monthHistory[index] = record;
      } else {
        state.appData.monthHistory.push(record);
      }
      state.appData.monthHistory.sort((a, b) => b.month.localeCompare(a.month));
    }

    function getThemeColors() {
      const styles = getComputedStyle(document.body);
      return {
        text: styles.getPropertyValue('--text').trim(),
        textSoft: styles.getPropertyValue('--text-soft').trim(),
        border: styles.getPropertyValue('--border').trim(),
        accent1: styles.getPropertyValue('--accent-1').trim(),
        accent2: styles.getPropertyValue('--accent-2').trim(),
        accent3: styles.getPropertyValue('--accent-3').trim(),
        accent4: styles.getPropertyValue('--accent-4').trim(),
        accent5: styles.getPropertyValue('--accent-5').trim(),
        bgSecondary: styles.getPropertyValue('--bg-secondary').trim()
      };
    }

    function notify(message, type = 'success', durationMs = 2600) {
      const wrap = document.getElementById('toastWrap');
      if (!wrap) return;
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = String(message || '');
      wrap.appendChild(toast);
      setTimeout(() => toast.remove(), durationMs);
    }

    function toggleDataMenu() {
      document.getElementById('dataMenu').classList.toggle('hidden');
    }

    function dismissOnboarding() {
      localStorage.setItem(ONBOARDING_KEY, '1');
      document.getElementById('onboardingBox').classList.add('hidden');
    }

    function maybeShowOnboarding() {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      document.getElementById('onboardingBox').classList.toggle('hidden', Boolean(seen));
    }

    function updateAutosaveStatus(text, stateName = 'disabled') {
      const el = document.getElementById('autosaveStatus');
      if (!el) return;
      el.textContent = text;
      el.classList.remove('is-saving', 'is-saved', 'is-disabled', 'is-error');
      el.classList.add(`is-${stateName}`);
    }

    function persistDataSilently() {
      if (!isAuthenticated()) {
        updateAutosaveStatus('Сохранение после входа', 'disabled');
        return false;
      }

      collectSettingsFromDOM();
      localStorage.setItem(getUserStorageKey(), JSON.stringify(state.appData));
      updateAutosaveStatus('Сохранено', 'saved');
      return true;
    }

    function scheduleAutoSave() {
      if (!isAuthenticated()) {
        updateAutosaveStatus('Сохранение после входа', 'disabled');
        return;
      }

      updateAutosaveStatus('Сохранение…', 'saving');
      clearTimeout(state.autosaveTimer);
      state.autosaveTimer = setTimeout(() => {
        persistDataSilently();
      }, AUTOSAVE_DELAY);
    }

    function toHex(buffer) {
      return [...new Uint8Array(buffer)].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    function randomSalt() {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return toHex(arr.buffer);
    }

    async function hashPassword(password, salt) {
      const enc = new TextEncoder();
      const data = enc.encode(`${salt}:${password}`);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return toHex(hash);
    }

    function getUserStorageKey() {
      if (!state.authState.userEmail) return '';
      return `${STORAGE_KEY}::${state.authState.userEmail}`;
    }

    function readAuthUsers() {
      const raw = localStorage.getItem(AUTH_USERS_KEY);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error(error);
        return [];
      }
    }

    function writeAuthUsers(users) {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    }

    function isAuthenticated() {
      return Boolean(state.authState.userEmail);
    }

    function updateDocumentTitle() {
      const baseTitle = 'Калькулятор семейного бюджета';
      document.title = isAuthenticated()
        ? `${baseTitle} — ${state.authState.userEmail}`
        : baseTitle;
    }

    function updateAuthButtonUI() {
      const btn = document.getElementById('authButton');
      if (!btn) return;
      btn.textContent = isAuthenticated() ? `👤 ${state.authState.userEmail}` : '👤 Войти';
      btn.title = isAuthenticated()
        ? `Вы вошли как ${state.authState.userEmail}. Нажмите, чтобы открыть профиль.`
        : 'Войти или зарегистрироваться';
      updateDocumentTitle();
      updateAutosaveStatus(isAuthenticated() ? 'Сохранено' : 'Сохранение после входа', isAuthenticated() ? 'saved' : 'disabled');
    }

    function getCurrentAuthUser(users = readAuthUsers()) {
      const email = String(state.authState.userEmail || '').trim().toLowerCase();
      if (!email) return null;
      return users.find(u => String(u.email || u.login || '').trim().toLowerCase() === email) || null;
    }

    function renderAuthModalView() {
      const isProfile = state.authView === 'profile' && isAuthenticated();
      const formSection = document.getElementById('authFormSection');
      const profileSection = document.getElementById('profileSection');
      const title = document.getElementById('authModalTitle');
      const msg = document.getElementById('authMessage');
      if (formSection) formSection.classList.toggle('hidden', isProfile);
      if (profileSection) profileSection.classList.toggle('hidden', !isProfile);
      if (title) title.textContent = isProfile ? 'Профиль' : (state.authMode === 'login' ? 'Вход' : 'Регистрация');
      if (isProfile) {
        const emailLabel = document.getElementById('profileEmailLabel');
        if (emailLabel) emailLabel.textContent = state.authState.userEmail || '—';
      }
      if (msg) msg.textContent = '';
    }

    function clearAuthFields() {
      document.getElementById('authEmail').value = '';
      document.getElementById('authPassword').value = '';
      const remember = document.getElementById('authRemember');
      if (remember) remember.checked = false;
      const currentPassword = document.getElementById('currentPassword');
      const newPassword = document.getElementById('newPassword');
      const confirmNewPassword = document.getElementById('confirmNewPassword');
      if (currentPassword) currentPassword.value = '';
      if (newPassword) newPassword.value = '';
      if (confirmNewPassword) confirmNewPassword.value = '';
      resetPasswordVisibility();
      document.getElementById('authMessage').textContent = '';
    }

    function resetPasswordVisibility() {
      document.querySelectorAll('.password-toggle[data-target]').forEach(btn => {
        const targetId = btn.getAttribute('data-target');
        const input = targetId ? document.getElementById(targetId) : null;
        if (input && input.type !== 'password') input.type = 'password';
        setPasswordToggleState(btn, false);
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Показать пароль');
      });
    }

    const EYE_ICON_OPEN = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.6 12c2.6-5.3 6.5-8 9.4-8s6.8 2.7 9.4 8c-2.6 5.3-6.5 8-9.4 8s-6.8-2.7-9.4-8Z" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" stroke-width="1.9"/></svg>`;
    const EYE_ICON_CLOSED = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.2 12c2.4-4.9 6.1-7.4 8.8-7.4 2.7 0 6.4 2.5 8.8 7.4-1.1 2.2-2.5 3.9-4.2 5.1" stroke-width="1.9" stroke-linecap="round"/><path d="M9.2 19.0c.9.3 1.8.4 2.8.4 2.9 0 6.8-2.7 9.4-7.4" stroke-width="1.9" stroke-linecap="round" opacity=".0"/><path d="M4 4l16 16" stroke-width="1.9" stroke-linecap="round"/><path d="M10.2 10.2a3.2 3.2 0 0 0 4.5 4.5" stroke-width="1.9" stroke-linecap="round"/></svg>`;

    function setPasswordToggleState(btn, isVisible) {
      btn.innerHTML = isVisible ? EYE_ICON_CLOSED : EYE_ICON_OPEN;
      btn.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
      btn.setAttribute('aria-label', isVisible ? 'Скрыть пароль' : 'Показать пароль');
    }

    function initPasswordToggles() {
      document.querySelectorAll('.password-toggle[data-target]').forEach(btn => {
        setPasswordToggleState(btn, false);
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = targetId ? document.getElementById(targetId) : null;
          if (!input) return;
          const nextVisible = input.type === 'password';
          input.type = nextVisible ? 'text' : 'password';
          setPasswordToggleState(btn, nextVisible);
          input.focus();
          try {
            const len = input.value?.length ?? 0;
            input.setSelectionRange(len, len);
          } catch (_) {}
        });
      });
    }

    function clearLegacyRememberedPassword() {
      const legacyRaw = localStorage.getItem('familyBudgetAuthRememberV1');
      if (!legacyRaw) return;
      try {
        const parsed = JSON.parse(legacyRaw);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify({
            email: String(parsed.email || '').trim().toLowerCase(),
            remember: Boolean(parsed.remember)
          }));
        }
      } catch (error) {
        console.error(error);
      }
      localStorage.removeItem('familyBudgetAuthRememberV1');
    }

    function readRememberedAuth() {
      clearLegacyRememberedPassword();
      const raw = localStorage.getItem(AUTH_REMEMBER_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
          email: String(parsed.email || '').trim().toLowerCase(),
          remember: Boolean(parsed.remember)
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    }

    function saveRememberedAuth(email, remember) {
      if (!remember) {
        localStorage.removeItem(AUTH_REMEMBER_KEY);
        return;
      }
      localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
        remember: true
      }));
    }

    function readStoredSession() {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            email: String(parsed.email || '').trim().toLowerCase(),
            nonce: String(parsed.nonce || '').trim()
          };
        }
      } catch (error) {
        const legacyEmail = String(raw || '').trim().toLowerCase();
        if (legacyEmail) return { email: legacyEmail, nonce: '' };
      }
      return null;
    }

    function writeStoredSession(email, nonce) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
        nonce: String(nonce || '').trim()
      }));
    }

    function applyRememberedAuthToForm() {
      const remembered = readRememberedAuth();
      const emailEl = document.getElementById('authEmail');
      const passwordEl = document.getElementById('authPassword');
      const rememberEl = document.getElementById('authRemember');

      if (emailEl) emailEl.value = remembered?.email || '';
      if (passwordEl) passwordEl.value = '';
      if (rememberEl) rememberEl.checked = Boolean(remembered?.remember);
    }

    function switchAuthMode(mode) {
      state.authView = 'auth';
      state.authMode = mode === 'register' ? 'register' : 'login';

      document.getElementById('authLoginTabBtn').classList.toggle('active', state.authMode === 'login');
      document.getElementById('authRegisterTabBtn').classList.toggle('active', state.authMode === 'register');
      document.getElementById('authSubmitBtn').textContent = state.authMode === 'login' ? 'Войти' : 'Зарегистрироваться';
      document.getElementById('authMessage').textContent = '';
      const passwordEl = document.getElementById('authPassword');
      if (passwordEl) passwordEl.value = '';
      renderAuthModalView();
    }

    function openAuthModal(mode = 'login') {
      state.authView = 'auth';
      switchAuthMode(mode);
      document.getElementById('authModal').classList.remove('hidden');
      applyRememberedAuthToForm();
      renderAuthModalView();
      document.getElementById('authEmail').focus();
    }

    function openProfileModal() {
      state.authView = 'profile';
      document.getElementById('authModal').classList.remove('hidden');
      renderAuthModalView();
    }

    function closeAuthModal() {
      document.getElementById('authModal').classList.add('hidden');
      state.authView = 'auth';
      clearAuthFields();
      renderAuthModalView();
    }

    async function migrateLegacyAuthUsers(users) {
      let changed = false;
      for (const user of users) {
        const normalizedEmail = String(user.email || user.login || '').trim().toLowerCase();
        if (normalizedEmail && user.email !== normalizedEmail) {
          user.email = normalizedEmail;
          user.login = normalizedEmail;
          changed = true;
        }
        if (user.password && !user.passwordHash) {
          const salt = randomSalt();
          user.passwordHash = await hashPassword(user.password, salt);
          user.salt = salt;
          user.failedAttempts = 0;
          user.lockedUntil = 0;
          delete user.password;
          changed = true;
        }
      }
      if (changed) writeAuthUsers(users);
      return users;
    }

    function loadUserDataAfterAuth(showMessage = true) {
      const key = getUserStorageKey();
      if (!key) return;

      const raw = localStorage.getItem(key);
      if (!raw) {
        state.appData = createEmptyAppData();
        normalizeAppData();
        applyAllStateToUI();
        updateAutosaveStatus('Сохранено', 'saved');
        if (showMessage) alert('У этого пользователя пока нет сохраненных данных. Загружено пустое состояние.');
        return;
      }

      try {
        state.appData = JSON.parse(raw);
        normalizeAppData();
        applyAllStateToUI();
        updateAutosaveStatus('Сохранено', 'saved');
      } catch (error) {
        console.error(error);
        alert('Ошибка загрузки данных пользователя.');
      }
    }

    async function submitAuth() {
      const email = document.getElementById('authEmail').value.trim().toLowerCase();
      const password = document.getElementById('authPassword').value;
      const remember = Boolean(document.getElementById('authRemember')?.checked);
      const msg = document.getElementById('authMessage');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        msg.textContent = 'Введите адрес электронной почты.';
        return;
      }

      if (!emailPattern.test(email)) {
        msg.textContent = 'Введите корректный адрес электронной почты.';
        return;
      }

      if (!password || password.length < 4) {
        msg.textContent = 'Пароль должен быть не короче 4 символов.';
        return;
      }

      const users = await migrateLegacyAuthUsers(readAuthUsers());

      if (state.authMode === 'register') {
        const existing = users.find(u => String(u.email || u.login || '').toLowerCase() === email);
        if (existing) {
          msg.textContent = 'Пользователь с такой электронной почтой уже существует.';
          return;
        }

        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        users.push({
          email,
          login: email,
          salt,
          passwordHash,
          failedAttempts: 0,
          lockedUntil: 0,
          createdAt: new Date().toISOString()
        });
        writeAuthUsers(users);
      }

      const found = users.find(u => String(u.email || u.login || '').toLowerCase() === email);
      if (!found) {
        msg.textContent = 'Неверная почта или пароль.';
        return;
      }

      if (Number(found.lockedUntil || 0) > Date.now()) {
        const sec = Math.ceil((found.lockedUntil - Date.now()) / 1000);
        msg.textContent = `Слишком много попыток. Повторите через ${sec} сек.`;
        return;
      }

      const tryHash = await hashPassword(password, found.salt);
      if (tryHash !== found.passwordHash) {
        found.failedAttempts = Number(found.failedAttempts || 0) + 1;
        if (found.failedAttempts >= 5) {
          found.failedAttempts = 0;
          found.lockedUntil = Date.now() + 60_000;
        }
        writeAuthUsers(users);
        msg.textContent = 'Неверная почта или пароль.';
        return;
      }

      found.failedAttempts = 0;
      found.lockedUntil = 0;
      found.email = email;
      found.login = email;
      writeAuthUsers(users);

      state.authState.userEmail = found.email;
      found.sessionNonce = String(found.sessionNonce || randomSalt());
      writeAuthUsers(users);
      writeStoredSession(found.email, found.sessionNonce);
      saveRememberedAuth(email, remember);
      updateAuthButtonUI();
      closeAuthModal();
      loadUserDataAfterAuth(false);
      calculateAll();

      if (state.authMode === 'register') {
        notify('Регистрация и вход выполнены успешно.');
      } else {
        notify('Вход выполнен.');
      }
    }

    function logoutUser(showMessage = true) {
      state.authState.userEmail = null;
      localStorage.removeItem(AUTH_SESSION_KEY);
      state.appData = createEmptyAppData();
      state.editingExpenseId = null;
      state.editingDailyIncomeId = null;
      state.selectedDay = '';
      updateAuthButtonUI();
      closeAuthModal();
      applyAllStateToUI();
      fillToday();
      fillTodayDailyIncome();
      if (showMessage) notify('Вы вышли из аккаунта. Калькулятор очищен и показывает нулевые значения до следующего входа.', 'error');
    }

    async function changePassword() {
      const msg = document.getElementById('authMessage');
      if (!isAuthenticated()) {
        msg.textContent = 'Сначала войдите в аккаунт.';
        return;
      }
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmNewPassword').value;
      if (!currentPassword) {
        msg.textContent = 'Введите текущий пароль.';
        return;
      }
      if (!newPassword || newPassword.length < 4) {
        msg.textContent = 'Новый пароль должен быть не короче 4 символов.';
        return;
      }
      if (newPassword !== confirmPassword) {
        msg.textContent = 'Подтверждение пароля не совпадает.';
        return;
      }
      const users = await migrateLegacyAuthUsers(readAuthUsers());
      const user = getCurrentAuthUser(users);
      if (!user) {
        msg.textContent = 'Пользователь не найден.';
        return;
      }
      const currentHash = await hashPassword(currentPassword, user.salt);
      if (currentHash !== user.passwordHash) {
        msg.textContent = 'Текущий пароль введён неверно.';
        return;
      }
      const newSalt = randomSalt();
      user.salt = newSalt;
      user.passwordHash = await hashPassword(newPassword, newSalt);
      user.failedAttempts = 0;
      user.lockedUntil = 0;
      user.sessionNonce = String(user.sessionNonce || randomSalt());
      writeAuthUsers(users);
      writeStoredSession(user.email, user.sessionNonce);
      clearAuthFields();
      renderAuthModalView();
      notify('Пароль успешно изменён.', 'success');
    }

    async function logoutAllSessions() {
      const msg = document.getElementById('authMessage');
      if (!isAuthenticated()) {
        msg.textContent = 'Сначала войдите в аккаунт.';
        return;
      }
      const users = await migrateLegacyAuthUsers(readAuthUsers());
      const user = getCurrentAuthUser(users);
      if (!user) {
        msg.textContent = 'Пользователь не найден.';
        return;
      }
      user.sessionNonce = randomSalt();
      writeAuthUsers(users);
      localStorage.removeItem(AUTH_REMEMBER_KEY);
      logoutUser(false);
      notify('Все сохранённые сессии сброшены. Войдите заново при необходимости.', 'success');
    }

    function onAuthButtonClick() {
      if (!isAuthenticated()) {
        openAuthModal('login');
        return;
      }

      openProfileModal();
    }

    function initAuth() {
      const remembered = readRememberedAuth();
      if (remembered?.remember) {
        applyRememberedAuthToForm();
      }

      const session = readStoredSession();
      if (session?.email) {
        const users = readAuthUsers();
        const found = users.find(u => String(u.email || u.login || '').trim().toLowerCase() === session.email);
        if (found) {
          const currentNonce = String(found.sessionNonce || '');
          if (!session.nonce || !currentNonce || session.nonce === currentNonce) {
            if (!currentNonce) {
              found.sessionNonce = randomSalt();
              writeAuthUsers(users);
              writeStoredSession(found.email || found.login, found.sessionNonce);
            }
            state.authState.userEmail = String(found.email || found.login || '').trim().toLowerCase();
          } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
          }
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      }

      updateAuthButtonUI();
      renderAuthModalView();
    }

    function initUXEnhancements() {
      // Переводим legacy alert в ненавязчивые тосты.
      const nativeAlert = window.alert.bind(window);
      window.alert = function(message) {
        notify(message, 'error');
      };
      window.__nativeAlert = nativeAlert;

      // Закрытие выпадающего меню при клике вне блока.
      document.addEventListener('click', (event) => {
        const menu = document.getElementById('dataMenu');
        const dropdown = event.target.closest('.dropdown');
        if (!dropdown && menu && !menu.classList.contains('hidden')) {
          menu.classList.add('hidden');
        }
      });

      // Горячие клавиши: Ctrl+S и Esc.
      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          saveData();
        }
        if (event.key === 'Escape') {
          const authModal = document.getElementById('authModal');
          if (authModal && !authModal.classList.contains('hidden')) {
            closeAuthModal();
          }
        }
      });

      document.getElementById('authModal').addEventListener('click', (event) => {
        if (event.target.id === 'authModal') closeAuthModal();
      });
    }



/* ===== layout.js ===== */
/* Файл: layout.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       12. ВКЛАДКИ
       ========================================================= */
    function initTabs() {
      const buttons = document.querySelectorAll('.tab-btn');
      const panels = document.querySelectorAll('.tab-panel');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;

          buttons.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));

          btn.classList.add('active');
          document.getElementById(`tab-${tab}`).classList.add('active');
        });
      });
    }

    /* =========================================================
       13. ТЕМА
       ========================================================= */
    function setTheme(theme) {
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
      document.getElementById('themeSwitch').checked = theme === 'dark';
      drawAllCharts();
    }

    function initTheme() {
      const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
      setTheme(savedTheme);

      document.getElementById('themeSwitch').addEventListener('change', () => {
        const current = document.body.getAttribute('data-theme') || 'light';
        setTheme(current === 'light' ? 'dark' : 'light');
      });
    }



/* ===== incomes.js ===== */
/* Файл: incomes.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       14. ДОХОДЫ
       ========================================================= */
    function addIncomeItem(name = '', amount = '') {
      state.appData.incomes.push({
        id: generateId(),
        name: name || 'Новый доход',
        amount: Number(amount) || 0
      });
      renderIncomes();
      calculateAll();
    }

    function updateIncome(id, field, value) {
      const item = state.appData.incomes.find(i => i.id === id);
      if (!item) return;
      item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
      calculateAll();
      scheduleAutoSave();
    }

    function deleteIncome(id) {
      state.appData.incomes = state.appData.incomes.filter(item => item.id !== id);
      renderIncomes();
      calculateAll();
    }

    function renderEmptyState(container, message) {
      if (!container) return false;
      container.innerHTML = `<div class="muted">${message}</div>`;
      return true;
    }

    function createCardElement(className, innerHTML) {
      const element = document.createElement('div');
      element.className = className;
      element.innerHTML = innerHTML;
      return element;
    }

    function appendList(container, items, renderItem) {
      if (!container) return;
      const fragment = document.createDocumentFragment();
      items.forEach(item => fragment.appendChild(renderItem(item)));
      container.appendChild(fragment);
    }

    function createInfoCell(title, value) {
      return `
        <div>
          <div class="data-title">${title}</div>
          <div class="data-value">${value}</div>
        </div>
      `;
    }

    function createActionButton(label, variant, call) {
      return `<button class="${variant}" type="button" data-call="${call}">${label}</button>`;
    }

    function createRowActions(actions) {
      return `<div class="actions" style="margin:0;">${actions.join('')}</div>`;
    }

    function parseCallArguments(rawArgs) {
      if (!rawArgs || !rawArgs.trim()) return [];
      const normalized = `[${rawArgs.replace(/\bthis\.value\b/g, 'event.target.value')}]`;
      try {
        return Function('event', `return ${normalized};`)(window.__delegatedEvent);
      } catch (error) {
        console.error('Не удалось разобрать аргументы обработчика:', rawArgs, error);
        return [];
      }
    }

    function executeDatasetCall(callString, event) {
      const match = String(callString || '').trim().match(/^([\w$]+)\((.*)\)$/s);
      if (!match) return;

      const [, functionName, rawArgs] = match;
      const handler = HANDLERS[functionName];
      if (typeof handler !== 'function') {
        console.warn(`Обработчик ${functionName} не найден.`);
        return;
      }

      window.__delegatedEvent = event;
      const args = parseCallArguments(rawArgs);
      window.__delegatedEvent = null;
      handler(...args);
    }

    function initActionDelegation() {
      document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-call]');
        if (!trigger) return;
        executeDatasetCall(trigger.dataset.call, event);
      });

      document.addEventListener('input', event => {
        const trigger = event.target.closest('[data-input-call]');
        if (!trigger) return;
        executeDatasetCall(trigger.dataset.inputCall, event);
      });
    }

    function renderIncomes() {
      const container = document.getElementById('incomeList');
      container.innerHTML = '';

      if (!state.appData.incomes.length) {
        renderEmptyState(container, 'Доходы пока не добавлены.');
        return;
      }

      appendList(container, state.appData.incomes, item => createCardElement('row-card', `
        <div class="row-grid-3">
          <div class="field" style="margin:0;">
            <label>Название дохода</label>
            <input type="text" value="${escapeHtml(item.name)}" data-input-call="updateIncome('${item.id}', 'name', this.value)" />
          </div>

          <div class="field" style="margin:0;">
            <label>Сумма (₽)</label>
            <input type="number" min="0" value="${item.amount}" data-input-call="updateIncome('${item.id}', 'amount', this.value)" />
          </div>

          ${createRowActions([
            createActionButton('Удалить', 'btn-danger', `deleteIncome('${item.id}')`)
          ])}
        </div>
      `));
    }

    /* =========================================================
       14.5 ДОХОДЫ: ПОСТУПЛЕНИЯ ПО ДНЯМ
       ========================================================= */
    function fillTodayDailyIncome() {
      const now = new Date();
      document.getElementById('dailyIncomeDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function submitDailyIncome() {
      const amount = parseFloat(document.getElementById('dailyIncomeAmount').value) || 0;
      const category = document.getElementById('dailyIncomeCategory').value.trim();
      const date = document.getElementById('dailyIncomeDate').value;
      const comment = document.getElementById('dailyIncomeComment').value.trim();

      if (!amount || amount <= 0) {
        alert('Введите корректную сумму поступления.');
        return;
      }

      if (!category) {
        alert('Введите источник / категорию поступления.');
        return;
      }

      if (!date) {
        alert('Выберите дату поступления.');
        return;
      }

      if (state.editingDailyIncomeId) {
        const item = state.appData.dailyIncomes.find(i => i.id === state.editingDailyIncomeId);
        if (item) {
          item.amount = amount;
          item.category = category;
          item.date = date;
          item.comment = comment;
        }
      } else {
        state.appData.dailyIncomes.unshift({
          id: generateId(),
          amount,
          category,
          date,
          comment
        });
      }

      clearDailyIncomeForm();
      renderDailyIncomes();
      calculateAll();
      scheduleAutoSave();
    }

    function clearDailyIncomeForm() {
      state.editingDailyIncomeId = null;
      document.getElementById('dailyIncomeAmount').value = '';
      document.getElementById('dailyIncomeCategory').value = '';
      document.getElementById('dailyIncomeComment').value = '';
      document.getElementById('dailyIncomeSubmitBtn').textContent = '+ Добавить поступление';
      document.getElementById('cancelDailyIncomeEditBtn').classList.add('hidden');
      fillTodayDailyIncome();
    }

    function editDailyIncome(id) {
      const item = state.appData.dailyIncomes.find(e => e.id === id);
      if (!item) return;

      state.editingDailyIncomeId = id;

      document.getElementById('dailyIncomeAmount').value = item.amount;
      document.getElementById('dailyIncomeCategory').value = item.category;
      document.getElementById('dailyIncomeDate').value = item.date;
      document.getElementById('dailyIncomeComment').value = item.comment || '';

      document.getElementById('dailyIncomeSubmitBtn').textContent = 'Сохранить изменения';
      document.getElementById('cancelDailyIncomeEditBtn').classList.remove('hidden');

      switchToTab('incomes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelDailyIncomeEdit() {
      clearDailyIncomeForm();
    }

    function deleteDailyIncome(id) {
      state.appData.dailyIncomes = state.appData.dailyIncomes.filter(item => item.id !== id);
      if (state.editingDailyIncomeId === id) {
        clearDailyIncomeForm();
      }
      renderDailyIncomes();
      calculateAll();
      scheduleAutoSave();
    }

    function renderDailyIncomes() {
      const container = document.getElementById('dailyIncomesList');
      container.innerHTML = '';

      if (!state.appData.dailyIncomes.length) {
        renderEmptyState(container, 'Поступления по дням пока не добавлены.');
        return;
      }

      const items = state.appData.dailyIncomes.slice().sort((a, b) => b.date.localeCompare(a.date));
      appendList(container, items, item => createCardElement('row-card', `
        <div class="row-grid-5">
          ${createInfoCell('Источник / категория', escapeHtml(item.category))}
          ${createInfoCell('Сумма', formatMoney(item.amount))}
          ${createInfoCell('Дата', escapeHtml(item.date))}
          ${createInfoCell('Комментарий', escapeHtml(item.comment || '—'))}
          ${createRowActions([
            createActionButton('Редактировать', 'btn-light', `editDailyIncome('${item.id}')`),
            createActionButton('Удалить', 'btn-danger', `deleteDailyIncome('${item.id}')`)
          ])}
        </div>
      `));
    }

    function addCategoryLimit() {
      const category = document.getElementById('limitCategory').value.trim();
      const amount = parseFloat(document.getElementById('limitAmount').value) || 0;
      if (!category || amount <= 0) {
        alert('Введите категорию и лимит больше нуля.');
        return;
      }

      const existing = state.appData.categoryLimits.find(x => x.category.toLowerCase() === category.toLowerCase());
      if (existing) existing.amount = amount;
      else state.appData.categoryLimits.push({ id: generateId(), category, amount });

      document.getElementById('limitCategory').value = '';
      document.getElementById('limitAmount').value = '';
      renderCategoryLimits();
      calculateAll();
    }

    function deleteCategoryLimit(id) {
      state.appData.categoryLimits = state.appData.categoryLimits.filter(x => x.id !== id);
      renderCategoryLimits();
      calculateAll();
    }

    function renderCategoryLimits() {
      const container = document.getElementById('limitsList');
      if (!container) return;
      container.innerHTML = '';
      if (!state.appData.categoryLimits.length) {
        renderEmptyState(container, 'Лимиты категорий пока не добавлены.');
        return;
      }

      appendList(container, state.appData.categoryLimits, item => createCardElement('row-card', `
        <div class="row-grid-3">
          ${createInfoCell('Категория', escapeHtml(item.category))}
          ${createInfoCell('Лимит', formatMoney(item.amount))}
          ${createRowActions([
            createActionButton('Удалить', 'btn-danger', `deleteCategoryLimit('${item.id}')`)
          ])}
        </div>
      `));
    }

    function addRecurringRule() {
      const type = document.getElementById('recurringType').value;
      const category = document.getElementById('recurringCategory').value.trim();
      const amount = parseFloat(document.getElementById('recurringAmount').value) || 0;
      const day = parseInt(document.getElementById('recurringDay').value, 10) || 0;
      const comment = document.getElementById('recurringComment').value.trim();

      if (!category || amount <= 0 || day < 1 || day > 31) {
        alert('Заполните тип, категорию, сумму и день месяца (1-31).');
        return;
      }

      state.appData.recurringRules.push({
        id: generateId(),
        type,
        category,
        amount,
        day,
        comment,
        appliedMonths: []
      });

      document.getElementById('recurringCategory').value = '';
      document.getElementById('recurringAmount').value = '';
      document.getElementById('recurringDay').value = '';
      document.getElementById('recurringComment').value = '';
      renderRecurringRules();
      calculateAll();
    }

    function deleteRecurringRule(id) {
      state.appData.recurringRules = state.appData.recurringRules.filter(x => x.id !== id);
      renderRecurringRules();
      calculateAll();
    }

    function renderRecurringRules() {
      const container = document.getElementById('recurringRulesList');
      if (!container) return;
      container.innerHTML = '';
      if (!state.appData.recurringRules.length) {
        renderEmptyState(container, 'Правила автодобавления пока не настроены.');
        return;
      }

      appendList(container, state.appData.recurringRules, item => createCardElement('row-card', `
        <div class="row-grid-5">
          ${createInfoCell('Тип', item.type === 'income' ? 'Доход' : 'Расход')}
          ${createInfoCell('Категория', escapeHtml(item.category))}
          ${createInfoCell('Сумма', formatMoney(item.amount))}
          ${createInfoCell('День / Комментарий', `${item.day} / ${escapeHtml(item.comment || '—')}`)}
          ${createRowActions([
            createActionButton('Удалить', 'btn-danger', `deleteRecurringRule('${item.id}')`)
          ])}
        </div>
      `));
    }

    function applyRecurringRulesForMonth(monthKey) {
      if (!monthKey) return;
      const [y, m] = monthKey.split('-').map(Number);
      const maxDay = new Date(y, m, 0).getDate();
      state.appData.recurringRules.forEach(rule => {
        if (!Array.isArray(rule.appliedMonths)) rule.appliedMonths = [];
        if (rule.appliedMonths.includes(monthKey)) return;

        const day = clamp(Number(rule.day) || 1, 1, maxDay);
        const date = `${monthKey}-${String(day).padStart(2, '0')}`;
        const payload = {
          id: generateId(),
          amount: Number(rule.amount) || 0,
          category: rule.category,
          date,
          comment: rule.comment || 'Регулярная операция'
        };
        if (rule.type === 'income') state.appData.dailyIncomes.unshift(payload);
        else state.appData.expenses.unshift(payload);
        rule.appliedMonths.push(monthKey);
      });
    }



/* ===== expenses.js ===== */
/* Файл: expenses.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       15. РАСХОДЫ: ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ / УДАЛЕНИЕ
       ========================================================= */
    function addMonthlyExpenseItem(name = '', amount = '') {
      state.appData.monthlyExpenses.push({
        id: generateId(),
        name: name || 'Новый ежемесячный расход',
        amount: Number(amount) || 0
      });
      renderMonthlyExpenses();
      calculateAll();
      scheduleAutoSave();
    }

    function updateMonthlyExpense(id, field, value) {
      const item = state.appData.monthlyExpenses.find(i => i.id === id);
      if (!item) return;
      item[field] = field === 'amount' ? (parseFloat(value) || 0) : value;
      calculateAll();
      scheduleAutoSave();
    }

    function deleteMonthlyExpense(id) {
      state.appData.monthlyExpenses = state.appData.monthlyExpenses.filter(item => item.id !== id);
      renderMonthlyExpenses();
      calculateAll();
      scheduleAutoSave();
    }

    function renderMonthlyExpenses() {
      const container = document.getElementById('monthlyExpenseList');
      if (!container) return;
      container.innerHTML = '';

      if (!state.appData.monthlyExpenses.length) {
        renderEmptyState(container, 'Ежемесячные расходы пока не добавлены.');
        return;
      }

      appendList(container, state.appData.monthlyExpenses, item => createCardElement('row-card', `
        <div class="row-grid-3">
          <div class="field" style="margin:0;">
            <label>Название расхода</label>
            <input type="text" value="${escapeHtml(item.name)}" data-input-call="updateMonthlyExpense('${item.id}', 'name', this.value)" />
          </div>

          <div class="field" style="margin:0;">
            <label>Сумма (₽)</label>
            <input type="number" min="0" value="${item.amount}" data-input-call="updateMonthlyExpense('${item.id}', 'amount', this.value)" />
          </div>

          ${createRowActions([
            createActionButton('Удалить', 'btn-danger', `deleteMonthlyExpense('${item.id}')`)
          ])}
        </div>
      `));
    }

    function submitExpense() {
      const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
      const category = document.getElementById('expenseCategory').value.trim();
      const date = document.getElementById('expenseDate').value;
      const comment = document.getElementById('expenseComment').value.trim();

      if (!amount || amount <= 0) {
        alert('Введите корректную сумму расхода.');
        return;
      }

      if (!category) {
        alert('Введите категорию расхода.');
        return;
      }

      if (!date) {
        alert('Выберите дату расхода.');
        return;
      }

      if (state.editingExpenseId) {
        const item = state.appData.expenses.find(e => e.id === state.editingExpenseId);
        if (item) {
          item.amount = amount;
          item.category = category;
          item.date = date;
          item.comment = comment;
        }
      } else {
        state.appData.expenses.unshift({
          id: generateId(),
          amount,
          category,
          date,
          comment
        });
      }

      clearExpenseForm();
      renderExpenses();
      calculateAll();
      scheduleAutoSave();
    }

    function clearExpenseForm() {
      state.editingExpenseId = null;
      document.getElementById('expenseAmount').value = '';
      document.getElementById('expenseCategory').value = '';
      document.getElementById('expenseComment').value = '';
      fillToday();

      document.getElementById('expenseSubmitBtn').textContent = '+ Добавить расход';
      document.getElementById('cancelEditBtn').classList.add('hidden');
    }

    function editExpense(id) {
      const item = state.appData.expenses.find(e => e.id === id);
      if (!item) return;

      state.editingExpenseId = id;

      document.getElementById('expenseAmount').value = item.amount;
      document.getElementById('expenseCategory').value = item.category;
      document.getElementById('expenseDate').value = item.date;
      document.getElementById('expenseComment').value = item.comment || '';

      document.getElementById('expenseSubmitBtn').textContent = 'Сохранить изменения';
      document.getElementById('cancelEditBtn').classList.remove('hidden');

      // Переходим на вкладку расходов, если пользователь редактирует запись.
      switchToTab('expenses');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelExpenseEdit() {
      clearExpenseForm();
    }

    function deleteExpense(id) {
      state.appData.expenses = state.appData.expenses.filter(item => item.id !== id);
      if (state.editingExpenseId === id) {
        clearExpenseForm();
      }
      renderExpenses();
      calculateAll();
      scheduleAutoSave();
    }

    function switchToTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    /* =========================================================
       16. ПОИСК / ФИЛЬТР РАСХОДОВ
       ========================================================= */
    function getFilteredExpenses() {
      const search = document.getElementById('expenseSearch').value.trim().toLowerCase();
      const category = document.getElementById('expenseCategoryFilter').value;
      const month = document.getElementById('expenseMonthFilter').value;
      const minAmount = parseFloat(document.getElementById('expenseMinAmount').value);
      const maxAmount = parseFloat(document.getElementById('expenseMaxAmount').value);
      const dateFrom = document.getElementById('expenseDateFrom').value;
      const dateTo = document.getElementById('expenseDateTo').value;

      return state.appData.expenses.filter(item => {
        const searchOk =
          !search ||
          item.category.toLowerCase().includes(search) ||
          (item.comment || '').toLowerCase().includes(search);

        const categoryOk = !category || item.category === category;
        const monthOk = !month || monthFromDate(item.date) === month;
        const minOk = Number.isNaN(minAmount) ? true : (Number(item.amount) || 0) >= minAmount;
        const maxOk = Number.isNaN(maxAmount) ? true : (Number(item.amount) || 0) <= maxAmount;
        const fromOk = !dateFrom || item.date >= dateFrom;
        const toOk = !dateTo || item.date <= dateTo;

        return searchOk && categoryOk && monthOk && minOk && maxOk && fromOk && toOk;
      });
    }

    function updateCategoryFilterOptions() {
      const select = document.getElementById('expenseCategoryFilter');
      const currentValue = select.value;

      const categories = [...new Set(state.appData.expenses.map(item => item.category).filter(Boolean))].sort();

      select.innerHTML = '<option value="">Все категории</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });

      if (categories.includes(currentValue)) {
        select.value = currentValue;
      }
    }

    function resetExpenseFilters() {
      document.getElementById('expenseSearch').value = '';
      document.getElementById('expenseCategoryFilter').value = '';
      document.getElementById('expenseMonthFilter').value = '';
      document.getElementById('expenseMinAmount').value = '';
      document.getElementById('expenseMaxAmount').value = '';
      document.getElementById('expenseDateFrom').value = '';
      document.getElementById('expenseDateTo').value = '';
      renderExpenses();
    }

    function renderExpenses() {
      const container = document.getElementById('expensesList');
      container.innerHTML = '';

      const filtered = getFilteredExpenses();

      if (!filtered.length) {
        renderEmptyState(container, 'По выбранным фильтрам расходов нет.');
        return;
      }

      appendList(container, filtered, item => createCardElement('row-card', `
        <div class="row-grid-5">
          ${createInfoCell('Категория', escapeHtml(item.category))}
          ${createInfoCell('Сумма', formatMoney(item.amount))}
          ${createInfoCell('Дата', escapeHtml(item.date))}
          ${createInfoCell('Комментарий', escapeHtml(item.comment || '—'))}
          ${createRowActions([
            createActionButton('Редактировать', 'btn-light', `editExpense('${item.id}')`),
            createActionButton('Удалить', 'btn-danger', `deleteExpense('${item.id}')`)
          ])}
        </div>
      `));
    }



/* ===== history.js ===== */
/* Файл: history.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       17. ИСТОРИЯ ПО МЕСЯЦАМ
       ========================================================= */
    function prefillSelectedMonthToHistory() {
      const month = getSelectedMonth();
      const record = getMonthRecord(month);

      document.getElementById('historyMonth').value = month;
      document.getElementById('historyPlanIncome').value = record?.planIncome ?? state.appData.settings.defaultIncomePlan ?? 0;
      document.getElementById('historyPlanExpense').value = record?.planExpense ?? state.appData.settings.defaultExpensePlan ?? 0;
      document.getElementById('historyPlanSavings').value = record?.planSavings ?? 0;
      document.getElementById('historyFactIncome').value = record?.factIncome ?? '';
      document.getElementById('historyFactExpense').value = record?.factExpense ?? '';
      document.getElementById('historyNote').value = record?.note ?? '';
    }

    function upsertMonthRecord() {
      const month = document.getElementById('historyMonth').value;
      if (!month) {
        alert('Выберите месяц.');
        return;
      }

      const record = {
        month,
        planIncome: parseFloat(document.getElementById('historyPlanIncome').value) || 0,
        planExpense: parseFloat(document.getElementById('historyPlanExpense').value) || 0,
        planSavings: parseFloat(document.getElementById('historyPlanSavings').value) || 0,
        factIncome: document.getElementById('historyFactIncome').value === '' ? null : (parseFloat(document.getElementById('historyFactIncome').value) || 0),
        factExpense: document.getElementById('historyFactExpense').value === '' ? null : (parseFloat(document.getElementById('historyFactExpense').value) || 0),
        note: document.getElementById('historyNote').value.trim()
      };

      upsertMonthHistoryRecord(record);
      renderMonthHistory();
      calculateAll();
      scheduleAutoSave();
    }

    function editMonthRecord(month) {
      const record = getMonthRecord(month);
      if (!record) return;

      document.getElementById('historyMonth').value = record.month;
      document.getElementById('historyPlanIncome').value = record.planIncome ?? 0;
      document.getElementById('historyPlanExpense').value = record.planExpense ?? 0;
      document.getElementById('historyPlanSavings').value = record.planSavings ?? 0;
      document.getElementById('historyFactIncome').value = record.factIncome ?? '';
      document.getElementById('historyFactExpense').value = record.factExpense ?? '';
      document.getElementById('historyNote').value = record.note ?? '';

      switchToTab('history');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteMonthRecord(month) {
      state.appData.monthHistory = state.appData.monthHistory.filter(item => item.month !== month);
      renderMonthHistory();
      calculateAll();
      scheduleAutoSave();
    }

    function renderMonthHistory() {
      const container = document.getElementById('monthHistoryList');
      container.innerHTML = '';

      if (!state.appData.monthHistory.length) {
        renderEmptyState(container, 'История по месяцам пока не заполнена.');
        return;
      }

      const items = state.appData.monthHistory.slice().sort((a, b) => b.month.localeCompare(a.month));
      appendList(container, items, item => createCardElement('row-card', `
        <div class="grid-4" style="align-items:end;">
          ${createInfoCell('Месяц', getMonthLabel(item.month))}
          ${createInfoCell('План дохода / расходов / накоплений', `${formatMoney(item.planIncome)} / ${formatMoney(item.planExpense)} / ${formatMoney(item.planSavings)}`)}
          ${createInfoCell('Факт дохода / расходов', `${item.factIncome === null ? 'Авто' : formatMoney(item.factIncome)} / ${item.factExpense === null ? 'Авто' : formatMoney(item.factExpense)}`)}
          ${createInfoCell('Заметка', escapeHtml(item.note || '—'))}
        </div>

        <div class="actions">
          ${createActionButton('Редактировать', 'btn-light', `editMonthRecord('${item.month}')`)}
          ${createActionButton('Удалить', 'btn-danger', `deleteMonthRecord('${item.month}')`)}
        </div>
      `));
    }

    /* =========================================================
       18. ЦЕЛИ
       ========================================================= */
    function addGoal() {
      const name = document.getElementById('goalName').value.trim();
      const target = parseFloat(document.getElementById('goalTarget').value) || 0;
      const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
      const deadline = document.getElementById('goalDeadline').value;

      if (!name) {
        alert('Введите название цели.');
        return;
      }

      if (!target || target <= 0) {
        alert('Введите корректную целевую сумму.');
        return;
      }

      state.appData.goals.push({
        id: generateId(),
        name,
        target,
        current,
        deadline
      });

      document.getElementById('goalName').value = '';
      document.getElementById('goalTarget').value = '';
      document.getElementById('goalCurrent').value = '';
      document.getElementById('goalDeadline').value = '';

      renderGoals();
      scheduleAutoSave();
    }

    function deleteGoal(id) {
      state.appData.goals = state.appData.goals.filter(item => item.id !== id);
      renderGoals();
      scheduleAutoSave();
    }

    function renderGoals() {
      const container = document.getElementById('goalsList');
      container.innerHTML = '';

      if (!state.appData.goals.length) {
        renderEmptyState(container, 'Целей пока нет.');
        return;
      }

      appendList(container, state.appData.goals, goal => {
        const percent = goal.target > 0 ? clamp((goal.current / goal.target) * 100, 0, 100) : 0;
        const remaining = Math.max(goal.target - goal.current, 0);

        return createCardElement('goal-card', `
          <div class="goal-header">
            <div>
              <div class="goal-name">${escapeHtml(goal.name)}</div>
              <div class="goal-meta">
                Цель: ${formatMoney(goal.target)}<br>
                Накоплено: ${formatMoney(goal.current)}<br>
                Осталось: ${formatMoney(remaining)}<br>
                Срок: ${goal.deadline ? escapeHtml(goal.deadline) : 'не указан'}
              </div>
            </div>

            ${createRowActions([
              createActionButton('Удалить', 'btn-danger', `deleteGoal('${goal.id}')`)
            ])}
          </div>

          <div class="progress-wrap">
            <div class="progress-top">
              <span>Выполнение цели</span>
              <span>${percent.toFixed(1)}%</span>
            </div>
            <div class="progress">
              <div class="progress-bar" style="width:${percent}%;"></div>
            </div>
          </div>
        `);
      });
    }

    /* =========================================================
       19. РЕЗЕРВНЫЙ ФОНД
       ========================================================= */
    function saveReserveFund() {
      state.appData.reserveFund.target = parseFloat(document.getElementById('reserveTarget').value) || 0;
      state.appData.reserveFund.current = parseFloat(document.getElementById('reserveCurrent').value) || 0;
      state.appData.reserveFund.monthlyContribution = parseFloat(document.getElementById('reserveMonthly').value) || 0;

      renderReserveFund();
      scheduleAutoSave();
    }

    function renderReserveFund() {
      document.getElementById('reserveTarget').value = state.appData.reserveFund.target || '';
      document.getElementById('reserveCurrent').value = state.appData.reserveFund.current || '';
      document.getElementById('reserveMonthly').value = state.appData.reserveFund.monthlyContribution || '';

      const target = state.appData.reserveFund.target || 0;
      const current = state.appData.reserveFund.current || 0;
      const monthly = state.appData.reserveFund.monthlyContribution || 0;

      const percent = target > 0 ? clamp((current / target) * 100, 0, 100) : 0;
      const remaining = Math.max(target - current, 0);
      const months = monthly > 0 ? Math.ceil(remaining / monthly) : null;

      document.getElementById('reservePercentCell').textContent = percent.toFixed(1) + '%';
      document.getElementById('reserveRemainingCell').textContent = formatMoney(remaining);
      document.getElementById('reserveMonthsCell').textContent = months === null ? '—' : String(months);
      document.getElementById('reserveStatusOverview').textContent = percent.toFixed(0) + '%';
    }

    /* =========================================================
       20. ИМПОРТ / ЭКСПОРТ / LOCAL STORAGE
       ========================================================= */
    function collectSettingsFromDOM() {
      state.appData.settings.selectedMonth = document.getElementById('selectedMonth').value || getCurrentMonthValue();
      state.appData.settings.familyMembers = parseInt(document.getElementById('familyMembers').value) || 1;
      state.appData.settings.defaultIncomePlan = parseFloat(document.getElementById('defaultIncomePlan').value) || 0;
      state.appData.settings.defaultExpensePlan = parseFloat(document.getElementById('defaultExpensePlan').value) || 0;
    }

    function applySettingsToDOM() {
      document.getElementById('selectedMonth').value = state.appData.settings.selectedMonth || getCurrentMonthValue();
      document.getElementById('familyMembers').value = state.appData.settings.familyMembers || 1;
      document.getElementById('defaultIncomePlan').value = state.appData.settings.defaultIncomePlan || '';
      document.getElementById('defaultExpensePlan').value = state.appData.settings.defaultExpensePlan || '';
      document.getElementById('expenseMonthFilter').value = state.appData.settings.selectedMonth || getCurrentMonthValue();
    }

    function saveData(showMessage = true) {
      if (!isAuthenticated()) {
        updateAutosaveStatus('Сохранение после входа', 'disabled');
        if (showMessage) alert('Сначала войдите в аккаунт. Без авторизации данные не сохраняются.');
        return;
      }

      persistDataSilently();
      if (showMessage) {
        alert('Данные сохранены в localStorage.');
      }
    }

    function loadData(showMessage = true) {
      if (!isAuthenticated()) {
        if (showMessage) alert('Сначала войдите в аккаунт.');
        return;
      }

      const raw = localStorage.getItem(getUserStorageKey());

      if (!raw) {
        if (showMessage) alert('Сохраненные данные не найдены для текущего пользователя.');
        return;
      }

      try {
        state.appData = JSON.parse(raw);
        normalizeAppData();
        applyAllStateToUI();
        updateAutosaveStatus('Сохранено', 'saved');
        if (showMessage) alert('Данные загружены.');
      } catch (error) {
        console.error(error);
        alert('Ошибка загрузки данных.');
      }
    }

    function exportData() {
      if (!isAuthenticated()) {
        alert('Экспорт доступен только после входа.');
        return;
      }

      collectSettingsFromDOM();

      const exportObject = {
        version: 'final-v1',
        exportedAt: new Date().toISOString(),
        owner: state.authState.userEmail,
        theme: document.body.getAttribute('data-theme') || 'light',
        data: state.appData
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-budget-${state.authState.userEmail}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function triggerImport() {
      if (!isAuthenticated()) {
        alert('Импорт доступен только после входа.');
        return;
      }
      document.getElementById('jsonFileInput').click();
    }

    function setupImportHandler() {
      document.getElementById('jsonFileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.owner && parsed.owner !== state.authState.userEmail) {
              alert(`Этот файл создан для пользователя "${parsed.owner}". Войдите под этим аккаунтом или используйте свой файл.`);
              return;
            }
            const importedData = parsed.data ? parsed.data : parsed;

            state.appData = importedData;
            normalizeAppData();
            applyAllStateToUI();

            if (parsed.theme) {
              setTheme(parsed.theme);
            }

            alert('JSON успешно импортирован.');
          } catch (error) {
            console.error(error);
            alert('Ошибка импорта JSON. Проверьте формат файла.');
          } finally {
            event.target.value = '';
          }
        };

        reader.readAsText(file, 'UTF-8');
      });
    }

    function resetAllData() {
      const ok = confirm('Удалить все данные приложения?');
      if (!ok) return;

      state.appData = createEmptyAppData();

      state.editingExpenseId = null;
      state.editingDailyIncomeId = null;
      if (isAuthenticated()) {
        localStorage.removeItem(getUserStorageKey());
      }
      applyAllStateToUI();
    }

    function normalizeAppData() {
      if (!state.appData.settings) state.appData.settings = {};
      if (!state.appData.incomes) state.appData.incomes = [];
      if (!state.appData.monthlyExpenses) state.appData.monthlyExpenses = [];
      if (!state.appData.expenses) state.appData.expenses = [];
      if (!state.appData.dailyIncomes) state.appData.dailyIncomes = [];
      if (!state.appData.categoryLimits) state.appData.categoryLimits = [];
      if (!state.appData.recurringRules) state.appData.recurringRules = [];
      if (!state.appData.monthHistory) state.appData.monthHistory = [];
      if (!state.appData.goals) state.appData.goals = [];
      if (!state.appData.reserveFund) state.appData.reserveFund = { target: 0, current: 0, monthlyContribution: 0 };

      if (!state.appData.settings.selectedMonth) state.appData.settings.selectedMonth = getCurrentMonthValue();
      if (!state.appData.settings.familyMembers) state.appData.settings.familyMembers = 1;
      if (state.appData.settings.defaultIncomePlan === undefined) state.appData.settings.defaultIncomePlan = 0;
      if (state.appData.settings.defaultExpensePlan === undefined) state.appData.settings.defaultExpensePlan = 0;
      state.appData.recurringRules.forEach(rule => {
        if (!Array.isArray(rule.appliedMonths)) rule.appliedMonths = [];
      });
    }



/* ===== analytics.js ===== */
/* Файл: analytics.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       21. РАСЧЕТЫ
       ========================================================= */
    function getActualIncomeForMonth(monthKey) {
      const record = getMonthRecord(monthKey);
      if (record && record.factIncome !== null && record.factIncome !== undefined) {
        return record.factIncome;
      }
      const monthlySources = state.appData.incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const dailySources = state.appData.dailyIncomes
        .filter(item => monthFromDate(item.date) === monthKey)
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      return monthlySources + dailySources;
    }

    function getActualExpenseForMonth(monthKey) {
      const record = getMonthRecord(monthKey);
      if (record && record.factExpense !== null && record.factExpense !== undefined) {
        return record.factExpense;
      }
      const monthlyRegular = state.appData.monthlyExpenses
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const dailyExpenses = state.appData.expenses
        .filter(item => monthFromDate(item.date) === monthKey)
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return monthlyRegular + dailyExpenses;
    }

    function getPlanForMonth(monthKey) {
      const record = getMonthRecord(monthKey);
      return {
        income: record?.planIncome ?? state.appData.settings.defaultIncomePlan ?? 0,
        expense: record?.planExpense ?? state.appData.settings.defaultExpensePlan ?? 0,
        savings: record?.planSavings ?? 0
      };
    }

    function getExpensesForMonth(monthKey) {
      const monthlyRegular = state.appData.monthlyExpenses.map(item => ({
        id: `monthly-${item.id}`,
        amount: Number(item.amount) || 0,
        category: item.name || 'Ежемесячный расход',
        date: `${monthKey}-01`,
        comment: 'Ежемесячный расход',
        isMonthlyRegular: true
      }));
      const dailyExpenses = state.appData.expenses.filter(item => monthFromDate(item.date) === monthKey);
      return [...monthlyRegular, ...dailyExpenses];
    }

    function getSummaryForSelectedMonth() {
      collectSettingsFromDOM();

      const monthKey = state.appData.settings.selectedMonth;
      const actualIncome = getActualIncomeForMonth(monthKey);
      const actualExpense = getActualExpenseForMonth(monthKey);
      const balance = actualIncome - actualExpense;
      const plan = getPlanForMonth(monthKey);
      const expenses = getExpensesForMonth(monthKey);
      const avgExpense = expenses.length ? actualExpense / expenses.length : 0;
      const familyMembers = Math.max(1, state.appData.settings.familyMembers || 1);
      const perPerson = balance / familyMembers;
      const savingsPercent = actualIncome > 0 ? (balance / actualIncome) * 100 : 0;
      const expensePercent = actualIncome > 0 ? (actualExpense / actualIncome) * 100 : 0;
      const goalCompletion = plan.savings > 0 ? clamp((balance / plan.savings) * 100, 0, 999) : (balance > 0 ? 100 : 0);

      return {
        monthKey,
        actualIncome,
        actualExpense,
        balance,
        plan,
        expenses,
        avgExpense,
        perPerson,
        savingsPercent,
        expensePercent,
        goalCompletion
      };
    }

    /* =========================================================
       22. АНАЛИТИКА ПО КАТЕГОРИЯМ / ДНЯМ / НЕДЕЛЯМ
       ========================================================= */
    function renderCategoryTotals(expenses) {
      const container = document.getElementById('categoryTotals');
      container.innerHTML = '';

      if (!expenses.length) {
        container.innerHTML = '<div class="muted">Нет расходов за выбранный месяц.</div>';
        return;
      }

      const totals = {};

      expenses.forEach(item => {
        if (!totals[item.category]) totals[item.category] = 0;
        totals[item.category] += item.amount;
      });

      Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, total]) => {
          const limit = state.appData.categoryLimits.find(x => x.category.toLowerCase() === category.toLowerCase());
          const over = limit ? total > (Number(limit.amount) || 0) : false;
          const row = document.createElement('div');
          row.className = 'category-row';
          row.innerHTML = `
            <span>${escapeHtml(category)}${limit ? ` (лимит: ${formatMoney(limit.amount)})` : ''}</span>
            <span>${formatMoney(total)}${over ? ' ⚠' : ''}</span>
          `;
          container.appendChild(row);
        });
    }

    function renderDailySummary() {
      const container = document.getElementById('dailySummary');
      if (!container) return;
      container.innerHTML = '';

      const monthKey = getSelectedMonth();
      const dailyMap = new Map();

      const ensureDay = (date) => {
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { income: 0, expense: 0, operations: 0 });
        }
        return dailyMap.get(date);
      };

      (state.appData.dailyIncomes || []).forEach(item => {
        if (!item || !item.date || monthFromDate(item.date) !== monthKey) return;
        const amount = Number(item.amount) || 0;
        if (amount <= 0) return;
        const day = ensureDay(item.date);
        day.income += amount;
        day.operations += 1;
      });

      (state.appData.expenses || []).forEach(item => {
        if (!item || !item.date || monthFromDate(item.date) !== monthKey) return;
        const amount = Number(item.amount) || 0;
        if (amount <= 0) return;
        const day = ensureDay(item.date);
        day.expense += amount;
        day.operations += 1;
      });

      const entries = Array.from(dailyMap.entries())
        .filter(([, day]) => day.operations > 0 && (day.income > 0 || day.expense > 0))
        .sort((a, b) => a[0].localeCompare(b[0]));

      if (!entries.length) {
        container.innerHTML = '<div class="muted">Нет операций по дням за выбранный месяц.</div>';
        return;
      }

      entries.forEach(([date, day]) => {
        const row = document.createElement('div');
        row.className = 'category-row';
        row.innerHTML = `
          <span>${escapeHtml(date)}</span>
          <span>
            <span class="positive">+${formatMoney(day.income)}</span>
            <span class="muted"> / </span>
            <span class="negative">-${formatMoney(day.expense)}</span>
          </span>`;
        container.appendChild(row);
      });
    }

    function toggleDailySummary() {
      const box = document.getElementById('dailySummary');
      box.classList.toggle('hidden');
    }

    function getWeekRangeForDate(dateISO) {
      const source = new Date(`${dateISO}T00:00:00`);
      const day = source.getDay() || 7;
      const start = new Date(source);
      start.setDate(source.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }

    function formatWeekRangeLabel(start, end, monthKey) {
      const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const visibleStart = start < monthStart ? monthStart : start;
      const visibleEnd = end > monthEnd ? monthEnd : end;
      const sameMonth = visibleStart.getMonth() === visibleEnd.getMonth();
      const left = `${visibleStart.getDate()} ${monthNames[visibleStart.getMonth()]}`;
      const right = sameMonth
        ? `${visibleEnd.getDate()} ${monthNames[visibleEnd.getMonth()]}`
        : `${visibleEnd.getDate()} ${monthNames[visibleEnd.getMonth()]}`;
      return `${left} — ${right}`;
    }

    function getWeekDatesWithinMonth(anchorISO, monthKey) {
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const { start, end } = getWeekRangeForDate(anchorISO);
      const dates = [];
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        if (cursor < monthStart || cursor > monthEnd) continue;
        dates.push(getISODate(cursor));
      }
      return { start, end, dates };
    }

    function shiftSelectedWeek(delta) {
      const monthKey = getSelectedMonth();
      const anchorISO = state.selectedDay && monthFromDate(state.selectedDay) === monthKey
        ? state.selectedDay
        : `${monthKey}-01`;
      const next = new Date(`${anchorISO}T00:00:00`);
      next.setDate(next.getDate() + (delta * 7));
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      if (next < monthStart) {
        state.selectedDay = getISODate(monthStart);
      } else if (next > monthEnd) {
        state.selectedDay = getISODate(monthEnd);
      } else {
        state.selectedDay = getISODate(next);
      }
      renderWeeklySummary();
      renderCalendar();
    }

    function renderWeeklySummary() {
      const container = document.getElementById('weeklySummary');
      const labelEl = document.getElementById('weeklyRangeLabel');
      if (!container || !labelEl) return;
      container.innerHTML = '';

      const monthKey = getSelectedMonth();
      const anchorISO = state.selectedDay && monthFromDate(state.selectedDay) === monthKey
        ? state.selectedDay
        : `${monthKey}-01`;
      const { start, end, dates } = getWeekDatesWithinMonth(anchorISO, monthKey);
      labelEl.textContent = formatWeekRangeLabel(start, end, monthKey);

      const weekIncomeItems = state.appData.dailyIncomes.filter(item => dates.includes(item.date));
      const weekExpenseItems = state.appData.expenses.filter(item => dates.includes(item.date));

      const incomeTotal = weekIncomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const expenseTotal = weekExpenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const balance = incomeTotal - expenseTotal;
      const balanceClass = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral';

      const stats = document.createElement('div');
      stats.className = 'weekly-stat-grid';
      stats.innerHTML = `
        <div class="weekly-stat">
          <div class="data-title">Доходы за неделю</div>
          <div class="data-value positive">${formatMoney(incomeTotal)}</div>
        </div>
        <div class="weekly-stat">
          <div class="data-title">Расходы за неделю</div>
          <div class="data-value negative">${formatMoney(expenseTotal)}</div>
        </div>
        <div class="weekly-stat">
          <div class="data-title">Баланс недели</div>
          <div class="data-value ${balanceClass}">${formatMoney(balance)}</div>
          <div class="weekly-balance-note">Баланс показывается как разница между фактическими доходами и расходами за выбранные дни недели.</div>
        </div>
      `;
      container.appendChild(stats);

      const details = document.createElement('div');
      details.className = 'category-grid';
      details.innerHTML = `
        <div class="category-row"><span>Доходных операций</span><span>${weekIncomeItems.length}</span></div>
        <div class="category-row"><span>Расходных операций</span><span>${weekExpenseItems.length}</span></div>
        <div class="category-row"><span>Период анализа</span><span>${escapeHtml(labelEl.textContent)}</span></div>
      `;
      container.appendChild(details);

      if (!weekIncomeItems.length && !weekExpenseItems.length) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = 'За выбранную неделю пока нет операций.';
        container.appendChild(empty);
      }
    }

    /* =========================================================
       22.5 КАЛЕНДАРЬ ПО ДНЯМ (ДОХОДЫ/РАСХОДЫ ПО КЛИКУ)
       ========================================================= */
    function pad2(n) {
      return String(n).padStart(2, '0');
    }

    function getISODate(dateObj) {
      return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
    }

    function formatDateHuman(dateISO) {
      const safeISO = String(dateISO || '');
      if (!safeISO) return '—';

      // Важно: добавляем "T00:00:00", чтобы не ловить смещения из-за часового пояса.
      const d = new Date(`${safeISO}T00:00:00`);
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

      const dd = pad2(d.getDate());
      const mm = pad2(d.getMonth() + 1);
      const yyyy = d.getFullYear();

      return `${dd}.${mm}.${yyyy} (${days[d.getDay()]})`;
    }

    function shiftCalendarMonth(deltaMonths) {
      const currentMonthKey = getSelectedMonth();
      const [year, month] = currentMonthKey.split('-').map(Number);
      const monthIndex = month - 1;

      const next = new Date(year, monthIndex + deltaMonths, 1);
      const nextMonthKey = `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;

      // Сохраняем "номер дня" при перелистывании месяца, если он существует.
      const selectedDayNum = state.selectedDay ? parseInt(state.selectedDay.slice(-2), 10) : 1;
      const daysInNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      const safeDayNum = clamp(selectedDayNum || 1, 1, daysInNextMonth);
      state.selectedDay = `${nextMonthKey}-${pad2(safeDayNum)}`;

      document.getElementById('selectedMonth').value = nextMonthKey;
      document.getElementById('expenseMonthFilter').value = nextMonthKey;
      calculateAll();
    }

    function onCalendarDayClick(dateISO) {
      const prevMonthKey = getSelectedMonth();
      const clickedMonthKey = monthFromDate(dateISO);

      state.selectedDay = dateISO;

      if (clickedMonthKey && clickedMonthKey !== prevMonthKey) {
        document.getElementById('selectedMonth').value = clickedMonthKey;
        document.getElementById('expenseMonthFilter').value = clickedMonthKey;
        calculateAll();
        return;
      }

      // Нужно обновить выделение (класс .selected) в сетке календаря.
      renderCalendar();
    }

    function renderCalendarSelectedDayDetails() {
      const titleEl = document.getElementById('calendarSelectedDayTitle');
      const incomeTotalEl = document.getElementById('calendarIncomeTotal');
      const expenseTotalEl = document.getElementById('calendarExpenseTotal');
      const balanceTotalEl = document.getElementById('calendarBalanceTotal');
      const balanceBoxEl = document.getElementById('calendarBalanceBox');
      const dailyIncomeListEl = document.getElementById('calendarDailyIncomeForDay');
      const expensesListEl = document.getElementById('calendarExpensesForDay');
      const incomeNoteEl = document.getElementById('calendarIncomeNote');
      const dailyIncomeDateEl = document.getElementById('dailyIncomeDate');

      if (!titleEl || !dailyIncomeListEl || !expensesListEl) return;

      if (!state.selectedDay) {
        titleEl.textContent = '—';
        if (dailyIncomeDateEl) dailyIncomeDateEl.value = '';
        incomeTotalEl.className = 'data-value positive';
        incomeTotalEl.textContent = '0 ₽';
        expenseTotalEl.className = 'data-value negative';
        expenseTotalEl.textContent = '0 ₽';
        balanceTotalEl.textContent = '0 ₽';
        dailyIncomeListEl.innerHTML = '<div class="muted">Нет доходов за выбранную дату.</div>';
        expensesListEl.innerHTML = '<div class="muted">Нет расходов за выбранную дату.</div>';
        if (balanceBoxEl) balanceBoxEl.className = 'calendar-balance-box neutral hidden';
        if (incomeNoteEl) incomeNoteEl.textContent = 'В дневной аналитике показываются только операции выбранной даты.';
        renderWeeklySummary();
        return;
      }

      if (dailyIncomeDateEl) dailyIncomeDateEl.value = state.selectedDay;

      const dayDailyIncomes = state.appData.dailyIncomes.filter(item => item.date === state.selectedDay);
      const dayExpenses = state.appData.expenses.filter(item => item.date === state.selectedDay);
      const incomeTotal = dayDailyIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const expenseTotal = dayExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const balance = incomeTotal - expenseTotal;

      titleEl.textContent = formatDateHuman(state.selectedDay);
      incomeTotalEl.textContent = formatMoney(incomeTotal);
      incomeTotalEl.className = 'data-value positive';
      expenseTotalEl.textContent = formatMoney(expenseTotal);
      expenseTotalEl.className = 'data-value negative';
      balanceTotalEl.textContent = formatMoney(balance);

      if (balanceBoxEl) {
        if (balance === 0) {
          balanceBoxEl.className = 'calendar-balance-box neutral hidden';
        } else {
          const cls = balance > 0 ? 'positive' : 'negative';
          balanceBoxEl.className = 'calendar-balance-box ' + cls;
          balanceTotalEl.className = 'data-value ' + cls;
        }
      }

      if (incomeNoteEl) {
        incomeNoteEl.textContent = 'Здесь показываются только доходы и расходы выбранной даты. Регулярные месячные суммы учитываются только в итогах месяца.';
      }

      dailyIncomeListEl.innerHTML = '';
      if (!dayDailyIncomes.length) {
        dailyIncomeListEl.innerHTML = '<div class="muted">Нет доходов за выбранную дату.</div>';
      } else {
        dayDailyIncomes.forEach(di => {
          const row = document.createElement('div');
          row.className = 'row-card';
          row.innerHTML = `
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
              <div style="flex:1;">
                <div class="data-title">Доход</div>
                <div class="data-value">${escapeHtml(di.name || 'Без названия')}</div>
                ${di.comment ? `<div class="muted">${escapeHtml(di.comment)}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div class="data-title">Сумма</div>
                <div class="data-value positive">${formatMoney(di.amount)}</div>
              </div>
            </div>
          `;
          dailyIncomeListEl.appendChild(row);
        });
      }

      expensesListEl.innerHTML = '';
      if (!dayExpenses.length) {
        expensesListEl.innerHTML = '<div class="muted">Нет расходов за выбранную дату.</div>';
      } else {
        dayExpenses.forEach(ex => {
          const row = document.createElement('div');
          row.className = 'row-card';
          row.innerHTML = `
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
              <div style="flex:1;">
                <div class="data-title">${escapeHtml(ex.category || 'Расход')}</div>
                <div class="data-value">${escapeHtml(ex.name || 'Без названия')}</div>
                ${ex.comment ? `<div class="muted">${escapeHtml(ex.comment)}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div class="data-title">Сумма</div>
                <div class="data-value negative">${formatMoney(ex.amount)}</div>
              </div>
            </div>
          `;
          expensesListEl.appendChild(row);
        });
      }

      renderWeeklySummary();
    }

    function renderCalendar() {
      const grid = document.getElementById('calendarGrid');
      const monthLabelEl = document.getElementById('calendarMonthLabel');
      if (!grid || !monthLabelEl) return;

      const monthKey = getSelectedMonth();
      monthLabelEl.textContent = getMonthLabel(monthKey);

      const [year, month] = monthKey.split('-').map(Number);
      const monthIndex = month - 1;

      const firstDay = new Date(year, monthIndex, 1);
      // Пн=0 ... Вс=6
      const offset = (firstDay.getDay() + 6) % 7;

      const startDate = new Date(year, monthIndex, 1);
      startDate.setDate(startDate.getDate() - offset);

      const todayISO = getISODate(new Date());

      // Считаем суммы/кол-во расходов по конкретным датам месяца.
      const expenseTotals = {};
      const expenseCounts = {};

      // Считаем суммы/кол-во поступлений (доходов) по конкретным датам месяца.
      const incomeTotals = {};
      const incomeCounts = {};

      state.appData.expenses.forEach(item => {
        if (monthFromDate(item.date) !== monthKey) return;
        const iso = item.date;
        const amount = Number(item.amount) || 0;
        expenseTotals[iso] = (expenseTotals[iso] || 0) + amount;
        expenseCounts[iso] = (expenseCounts[iso] || 0) + 1;
      });

      state.appData.dailyIncomes.forEach(item => {
        if (monthFromDate(item.date) !== monthKey) return;
        const iso = item.date;
        const amount = Number(item.amount) || 0;
        incomeTotals[iso] = (incomeTotals[iso] || 0) + amount;
        incomeCounts[iso] = (incomeCounts[iso] || 0) + 1;
      });

      // Выбираем дату по умолчанию, если текущий state.selectedDay не относится к отображаемому месяцу.
      if (!state.selectedDay || monthFromDate(state.selectedDay) !== monthKey) {
        const expenseDates = Object.keys(expenseCounts);
        const incomeDates = Object.keys(incomeCounts);
        const candidates = new Set([...expenseDates, ...incomeDates]);
        const sortedCandidates = [...candidates].sort((a, b) => a.localeCompare(b));
        state.selectedDay = sortedCandidates.length ? sortedCandidates[0] : `${monthKey}-01`;
      }

      grid.innerHTML = '';
      for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        const outside = monthFromDate(iso) !== monthKey;

        const expenseCount = expenseCounts[iso] || 0;
        const expenseTotal = expenseTotals[iso] || 0;

        const incomeCount = incomeCounts[iso] || 0;
        const incomeTotal = incomeTotals[iso] || 0;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar-day' + (outside ? ' outside' : '');

        if (iso === todayISO) btn.classList.add('today');
        if (iso === state.selectedDay) btn.classList.add('selected');

        if (!outside) {
          const dayBalance = incomeTotal - expenseTotal;
          if (dayBalance > 0) btn.classList.add('day-positive');
          if (dayBalance < 0) btn.classList.add('day-negative');
        }

        const titleParts = [];
        if (incomeCount > 0) titleParts.push(`Доходы за день: ${formatMoney(incomeTotal)} (${incomeCount})`);
        if (expenseCount > 0) titleParts.push(`Расходы за день: ${formatMoney(expenseTotal)} (${expenseCount})`);
        if (titleParts.length) btn.title = titleParts.join(' | ');

        btn.setAttribute(
          'aria-label',
          'Дата ' +
            iso +
            (incomeCount ? '. Поступления: ' + incomeCount : '') +
            (expenseCount ? '. Расходов: ' + expenseCount : '')
        );
        btn.addEventListener('click', () => onCalendarDayClick(iso));
        btn.innerHTML = `
          <div class="calendar-day-num">${d.getDate()}</div>
          <div class="calendar-pills-col">
            ${
              expenseCount > 0
                ? `<div class="calendar-expense-pill">${expenseCount}</div>`
                : `<div style="height: 18px;"></div>`
            }
            ${
              incomeCount > 0
                ? `<div class="calendar-income-pill">${incomeCount}</div>`
                : `<div style="height: 18px;"></div>`
            }
          </div>
        `;

        grid.appendChild(btn);
      }

      renderCalendarSelectedDayDetails();
    }



/* ===== charts.js ===== */
/* Файл: charts.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       23. ПЛАН / ФАКТ ТАБЛИЦА
       ========================================================= */
    function renderPlanFactTable(summary) {
      const tbody = document.getElementById('planFactTableBody');

      const planIncome = summary.plan.income;
      const planExpense = summary.plan.expense;
      const planSavings = summary.plan.savings;

      const factIncome = summary.actualIncome;
      const factExpense = summary.actualExpense;
      const factSavings = summary.balance;

      const incomeDiff = factIncome - planIncome;
      const expenseDiff = factExpense - planExpense;
      const savingsDiff = factSavings - planSavings;

      tbody.innerHTML = `
        <tr>
          <td>Доход</td>
          <td>${formatMoney(planIncome)}</td>
          <td>${formatMoney(factIncome)}</td>
          <td>${formatMoney(incomeDiff)}</td>
        </tr>
        <tr>
          <td>Расходы</td>
          <td>${formatMoney(planExpense)}</td>
          <td>${formatMoney(factExpense)}</td>
          <td>${formatMoney(expenseDiff)}</td>
        </tr>
        <tr>
          <td>Накопления / остаток</td>
          <td>${formatMoney(planSavings)}</td>
          <td>${formatMoney(factSavings)}</td>
          <td>${formatMoney(savingsDiff)}</td>
        </tr>
      `;
    }

    /* =========================================================
       24. ОСНОВНОЙ РАСЧЕТ И ВЫВОД В ИНТЕРФЕЙС
       ========================================================= */
    function calculateAll() {
      collectSettingsFromDOM();
      applyRecurringRulesForMonth(state.appData.settings.selectedMonth);
      const summary = getSummaryForSelectedMonth();

      let statusText = '';
      let tipsText = '';
      let balanceClass = 'neutral';

      if (summary.actualIncome === 0 && summary.actualExpense === 0) {
        statusText = 'Нет данных';
        tipsText = 'Добавьте хотя бы один доход и расходы или заполните историю по месяцам.';
      } else if (summary.balance > 0) {
        balanceClass = 'positive';

        if (summary.plan.savings > 0 && summary.balance >= summary.plan.savings) {
          statusText = 'Профицит и план выполнен';
          tipsText = `После всех расходов остается <strong>${formatMoney(summary.balance)}</strong>, и это покрывает план накоплений <strong>${formatMoney(summary.plan.savings)}</strong>.`;
        } else if (summary.plan.savings > 0 && summary.balance < summary.plan.savings) {
          statusText = 'Профицит, но план накоплений не достигнут';
          tipsText = `После расходов остается <strong>${formatMoney(summary.balance)}</strong>, но до планового накопления не хватает <strong>${formatMoney(summary.plan.savings - summary.balance)}</strong>.`;
        } else {
          statusText = 'Профицит';
          tipsText = `Бюджет положительный. Остаток за месяц составляет <strong>${formatMoney(summary.balance)}</strong>.`;
        }
      } else if (summary.balance === 0) {
        balanceClass = 'neutral';
        statusText = 'Бюджет в ноль';
        tipsText = 'Доходы полностью равны расходам. Дефицита нет, но и запаса тоже нет.';
      } else {
        balanceClass = 'negative';
        statusText = 'Дефицит';
        tipsText = `Расходы превышают доходы на <strong>${formatMoney(Math.abs(summary.balance))}</strong>. Стоит пересмотреть крупные категории расходов.`;
      }

      document.getElementById('totalIncomeResult').textContent = formatMoney(summary.actualIncome);
      document.getElementById('totalExpensesResult').textContent = formatMoney(summary.actualExpense);

      const balanceEl = document.getElementById('balanceResult');
      balanceEl.textContent = formatMoney(summary.balance);
      balanceEl.className = 'summary-value ' + balanceClass;

      document.getElementById('savingsPercentResult').textContent = summary.savingsPercent.toFixed(1) + '%';
      document.getElementById('expenseCountResult').textContent = String(summary.expenses.length);
      document.getElementById('averageExpenseResult').textContent = formatMoney(summary.avgExpense);
      document.getElementById('perPersonResult').textContent = formatMoney(summary.perPerson);

      document.getElementById('incomeCategoriesTable').textContent = String(state.appData.incomes.length);
      document.getElementById('expenseCategoriesTable').textContent = String(summary.expenses.length);
      document.getElementById('goalTable').textContent = formatMoney(summary.plan.savings);
      document.getElementById('goalStatusTable').textContent = summary.goalCompletion.toFixed(0) + '%';
      document.getElementById('statusTable').textContent = statusText;
      document.getElementById('tipsText').innerHTML = tipsText;

      const progressBar = document.getElementById('expenseProgressBar');
      const progressWidth = clamp(summary.expensePercent, 0, 100);
      progressBar.style.width = progressWidth + '%';
      document.getElementById('expensePercentLabel').textContent = summary.expensePercent.toFixed(1) + '%';

      if (summary.expensePercent < 60) {
        progressBar.style.background = 'linear-gradient(90deg, var(--accent-2), var(--accent-1))';
      } else if (summary.expensePercent < 85) {
        progressBar.style.background = 'linear-gradient(90deg, var(--accent-3), var(--accent-1))';
      } else {
        progressBar.style.background = 'linear-gradient(90deg, var(--accent-4), var(--accent-3))';
      }

      renderPlanFactTable(summary);
      renderCategoryTotals(summary.expenses);
      renderDailySummary();
      renderWeeklySummary();
      renderCalendar();
      renderReserveFund();
      drawAllCharts();
      scheduleAutoSave();
    }

    /* =========================================================
       25. CANVAS: УНИВЕРСАЛЬНЫЕ ГРАФИКИ
       ========================================================= */
    function drawLineChart(canvasId, labels, seriesList, options = {}) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getThemeColors();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const padding = { top: 30, right: 20, bottom: 50, left: 50 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;

      const allValues = seriesList.flatMap(s => s.values);
      const maxValue = Math.max(...allValues, 1);

      // Оси
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.stroke();

      // Сетка и подписи оси Y
      ctx.fillStyle = colors.textSoft;
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        const value = Math.round(maxValue - (maxValue / 5) * i);

        ctx.strokeStyle = colors.border;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        ctx.fillText(value.toLocaleString('ru-RU'), padding.left - 8, y + 4);
      }

      // Подписи X
      ctx.textAlign = 'center';
      labels.forEach((label, index) => {
        const x = padding.left + (chartWidth / Math.max(labels.length - 1, 1)) * index;
        ctx.fillStyle = colors.textSoft;
        ctx.fillText(label, x, padding.top + chartHeight + 20);
      });

      // Линии
      seriesList.forEach(series => {
        ctx.beginPath();
        ctx.strokeStyle = series.color;
        ctx.lineWidth = 3;

        series.values.forEach((value, index) => {
          const x = padding.left + (chartWidth / Math.max(series.values.length - 1, 1)) * index;
          const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Точки
        series.values.forEach((value, index) => {
          const x = padding.left + (chartWidth / Math.max(series.values.length - 1, 1)) * index;
          const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

          ctx.beginPath();
          ctx.fillStyle = series.color;
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Легенда
      let legendX = padding.left;
      const legendY = 14;

      seriesList.forEach(series => {
        ctx.fillStyle = series.color;
        ctx.fillRect(legendX, legendY - 10, 14, 8);

        ctx.fillStyle = colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(series.name, legendX + 20, legendY - 2);

        legendX += ctx.measureText(series.name).width + 45;
      });
    }

    function drawBarChart(canvasId, labels, values, color) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getThemeColors();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const padding = { top: 30, right: 20, bottom: 60, left: 50 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;
      const maxValue = Math.max(...values, 1);
      const barWidth = chartWidth / Math.max(values.length, 1) * 0.6;
      const step = chartWidth / Math.max(values.length, 1);

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.stroke();

      ctx.fillStyle = colors.textSoft;
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        const value = Math.round(maxValue - (maxValue / 5) * i);

        ctx.strokeStyle = colors.border;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        ctx.fillText(value.toLocaleString('ru-RU'), padding.left - 8, y + 4);
      }

      labels.forEach((label, index) => {
        const x = padding.left + step * index + step / 2;
        const value = values[index];
        const barHeight = (value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        ctx.fillStyle = colors.textSoft;
        ctx.textAlign = 'center';
        ctx.fillText(label, x, padding.top + chartHeight + 18);
      });
    }

    function getLast12Months() {
      const result = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      return result;
    }

    function drawAllCharts() {
      const months = getLast12Months();
      const labels = months.map(m => m.slice(5));
      const colors = getThemeColors();

      const actualExpenses = months.map(m => getActualExpenseForMonth(m));
      const actualIncomes = months.map(m => getActualIncomeForMonth(m));
      const planExpenses = months.map(m => getPlanForMonth(m).expense);

      drawLineChart(
        'monthlyExpenseChart',
        labels,
        [
          { name: 'Фактические расходы', color: colors.accent4, values: actualExpenses }
        ]
      );

      drawLineChart(
        'planFactChart',
        labels,
        [
          { name: 'План расходов', color: colors.accent3, values: planExpenses },
          { name: 'Факт расходов', color: colors.accent1, values: actualExpenses }
        ]
      );

      drawBarChart('monthlyExpenseBarChart', labels, actualExpenses, colors.accent2);

      drawLineChart(
        'monthlyIncomeChart',
        labels,
        [
          { name: 'Фактические доходы', color: colors.accent2, values: actualIncomes }
        ]
      );
    }



/* ===== app.js ===== */
/* Файл: app.js | Сгенерировано из исходного app.js после модульного разделения */

    /* =========================================================
       26. ПРИМЕНЕНИЕ СОСТОЯНИЯ К ИНТЕРФЕЙСУ
       ========================================================= */
    function applyAllStateToUI() {
      applySettingsToDOM();
      renderIncomes();
      renderMonthlyExpenses();
      renderExpenses();
      renderDailyIncomes();
      renderCategoryLimits();
      renderRecurringRules();
      renderMonthHistory();
      renderGoals();
      renderReserveFund();
      clearExpenseForm();
      clearDailyIncomeForm();
      prefillSelectedMonthToHistory();
      calculateAll();
    }

    /* =========================================================
       27. ПЕЧАТЬ / PDF
       ========================================================= */
    function printReport() {
      calculateAll();
      window.print();
    }

    /* =========================================================
       28. СЛУШАТЕЛИ СОБЫТИЙ
       ========================================================= */
    function setupAutoEvents() {
      document.getElementById('selectedMonth').addEventListener('change', () => {
        document.getElementById('expenseMonthFilter').value = document.getElementById('selectedMonth').value;
        calculateAll();
      });

      document.getElementById('familyMembers').addEventListener('input', calculateAll);
      document.getElementById('defaultIncomePlan').addEventListener('input', calculateAll);
      document.getElementById('defaultExpensePlan').addEventListener('input', calculateAll);

      document.getElementById('expenseSearch').addEventListener('input', renderExpenses);
      document.getElementById('expenseCategoryFilter').addEventListener('change', renderExpenses);
      document.getElementById('expenseMonthFilter').addEventListener('change', renderExpenses);
      document.getElementById('expenseMinAmount').addEventListener('input', renderExpenses);
      document.getElementById('expenseMaxAmount').addEventListener('input', renderExpenses);
      document.getElementById('expenseDateFrom').addEventListener('change', renderExpenses);
      document.getElementById('expenseDateTo').addEventListener('change', renderExpenses);
    }

    /* =========================================================
       29. ИНИЦИАЛИЗАЦИЯ
       ========================================================= */
    window.addEventListener('DOMContentLoaded', () => {
      initTabs();
      initTheme();
      initAuth();
      initPasswordToggles();
      initUXEnhancements();
      initActionDelegation();
      maybeShowOnboarding();
      setupImportHandler();
      setupAutoEvents();

      const raw = isAuthenticated() ? localStorage.getItem(getUserStorageKey()) : null;

      if (raw) {
        try {
          state.appData = JSON.parse(raw);
        } catch (error) {
          console.error(error);
          state.appData = createEmptyAppData();
        }
      } else {
        state.appData = createEmptyAppData();
      }

      normalizeAppData();
      applyAllStateToUI();
      fillToday();
      fillTodayDailyIncome();
    });



Object.assign(HANDLERS, {
  createEmptyAppData,
  formatMoney,
  clamp,
  escapeHtml,
  generateId,
  getCurrentMonthValue,
  fillToday,
  monthFromDate,
  getSelectedMonth,
  getMonthLabel,
  getISOWeekLabel,
  getMonthRecord,
  upsertMonthHistoryRecord,
  getThemeColors,
  notify,
  toggleDataMenu,
  dismissOnboarding,
  maybeShowOnboarding,
  updateAutosaveStatus,
  persistDataSilently,
  scheduleAutoSave,
  toHex,
  randomSalt,
  getUserStorageKey,
  readAuthUsers,
  writeAuthUsers,
  isAuthenticated,
  updateDocumentTitle,
  updateAuthButtonUI,
  clearAuthFields,
  readRememberedAuth,
  saveRememberedAuth,
  applyRememberedAuthToForm,
  switchAuthMode,
  openAuthModal,
  closeAuthModal,
  submitAuth,
  loadUserDataAfterAuth,
  logoutUser,
  openProfileModal,
  changePassword,
  logoutAllSessions,
  onAuthButtonClick,
  initAuth,
  initUXEnhancements,
  initTabs,
  setTheme,
  initTheme,
  addIncomeItem,
  addMonthlyExpenseItem,
  updateMonthlyExpense,
  deleteMonthlyExpense,
  renderMonthlyExpenses,
  updateIncome,
  deleteIncome,
  renderEmptyState,
  createCardElement,
  appendList,
  createInfoCell,
  createActionButton,
  createRowActions,
  parseCallArguments,
  executeDatasetCall,
  initActionDelegation,
  renderIncomes,
  fillTodayDailyIncome,
  submitDailyIncome,
  clearDailyIncomeForm,
  editDailyIncome,
  cancelDailyIncomeEdit,
  deleteDailyIncome,
  renderDailyIncomes,
  addCategoryLimit,
  deleteCategoryLimit,
  renderCategoryLimits,
  addRecurringRule,
  deleteRecurringRule,
  renderRecurringRules,
  applyRecurringRulesForMonth,
  submitExpense,
  clearExpenseForm,
  editExpense,
  cancelExpenseEdit,
  deleteExpense,
  switchToTab,
  getFilteredExpenses,
  updateCategoryFilterOptions,
  resetExpenseFilters,
  renderExpenses,
  prefillSelectedMonthToHistory,
  upsertMonthRecord,
  editMonthRecord,
  deleteMonthRecord,
  renderMonthHistory,
  addGoal,
  deleteGoal,
  renderGoals,
  saveReserveFund,
  renderReserveFund,
  collectSettingsFromDOM,
  applySettingsToDOM,
  saveData,
  loadData,
  exportData,
  triggerImport,
  setupImportHandler,
  resetAllData,
  normalizeAppData,
  getActualIncomeForMonth,
  getActualExpenseForMonth,
  getPlanForMonth,
  getExpensesForMonth,
  getSummaryForSelectedMonth,
  renderCategoryTotals,
  renderDailySummary,
  toggleDailySummary,
  renderWeeklySummary,
  pad2,
  getISODate,
  formatDateHuman,
  shiftCalendarMonth,
  shiftSelectedWeek,
  onCalendarDayClick,
  renderCalendarSelectedDayDetails,
  renderCalendar,
  renderPlanFactTable,
  calculateAll,
  drawLineChart,
  drawBarChart,
  getLast12Months,
  drawAllCharts,
  applyAllStateToUI,
  printReport,
  setupAutoEvents
});
