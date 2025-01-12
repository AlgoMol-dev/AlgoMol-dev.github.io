// Initialize LeanCloud
AV.init({
    appId: 'ZxhupKKmXgSXHf1uyEckW1xv-gzGzoHsz',
    appKey: '3YQM3gLlbLMBy3mmZulgwIlS',
    serverURL: 'https://zxhupkkm.lc-cn-n1-shared.com'
});

// Auth state management
async function checkLoginState() {
    const currentUser = AV.User.current();
    if (currentUser) {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
            return;
        }
        document.getElementById('current-user').textContent = currentUser.getUsername();

        if (await isAdmin(currentUser)) {
            document.getElementById('admin-section').classList.remove('hidden');
        }
    } else if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Login handler
async function handleLogin(username, password) {
    try {
        await AV.User.logIn(username, password);
        window.location.href = 'dashboard.html';
    } catch (err) {
        alert(`Login failed: ${err.message}`);
    }
}

// Signup handler
async function handleSignup(username, password) {
    const user = new AV.User();
    user.setUsername(username);
    user.setPassword(password);

    try {
        await user.signUp();
        alert('Sign up successful (pending admin approval)!');
        window.location.href = 'dashboard.html';
    } catch (err) {
        alert(`Sign up failed: ${err.message}`);
    }
}

// Logout handler
async function handleLogout() {
    try {
        await AV.User.logOut();
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
    }
}

// Admin check
async function isAdmin(user) {
    if (!user) return false;
    return user.getUsername() === 'admin';
}

// Event listeners for login page
if (window.location.pathname.includes('login.html')) {
    document.getElementById('btn-login').addEventListener('click', () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (username && password) handleLogin(username, password);
    });

    document.getElementById('btn-signup').addEventListener('click', () => {
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        if (username && password) handleSignup(username, password);
    });
}

// Event listener for dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
}

// Check login state on page load
checkLoginState();
