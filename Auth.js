// ─── auth.js ────────────────────────────────────────────────────────────────
// Tiny client-side auth layer using localStorage.
// NOT for production – passwords are stored in plain text on the device.
// ────────────────────────────────────────────────────────────────────────────
 
const Auth = (() => {
  const USERS_KEY   = 'bt_users';      // { username → password }
  const SESSION_KEY = 'bt_session';    // currently logged-in username
 
  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  }
 
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
 
  /** Register a new user. Returns { ok, error } */
  function register(username, password) {
    if (!username || !password) return { ok: false, error: 'Заполните все поля.' };
    const users = getUsers();
    if (users[username]) return { ok: false, error: 'Пользователь уже существует.' };
    users[username] = password;
    saveUsers(users);
    return { ok: true };
  }
 
  /** Login. Returns { ok, error } */
  function login(username, password, remember) {
    const users = getUsers();
    if (!users[username] || users[username] !== password)
      return { ok: false, error: 'Неверное имя или пароль.' };
    // remember → localStorage keeps it after tab close; else sessionStorage
    if (remember) {
      localStorage.setItem(SESSION_KEY, username);
    } else {
      sessionStorage.setItem(SESSION_KEY, username);
    }
    return { ok: true };
  }
 
  /** Returns the current username or null */
  function currentUser() {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || null;
  }
 
  /** Logout */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }
 
  return { register, login, logout, currentUser };
})();