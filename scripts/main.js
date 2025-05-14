// --- Configuration ---
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCIRbVqnxxhruGC-7yZjasWpHYlIqlo9z5U2RCpv4-qz6VF7I8XRqO7hqjPkXMDuNA/exec';
const USER_DATA_KEY = 'googleUserDataToken';
window.decodedToken = null;

// --- DOM Elements ---
const googleSignInButtonContainer = document.getElementById('googleSignInButtonContainer');
const userInfoDiv = document.getElementById('userInfo');
const userNameSpan = document.getElementById('userName');
const userEmailSpan = document.getElementById('userEmail');
const userPhotoImg = document.getElementById('userPhoto');
const logoutButton = document.getElementById('logoutButton');
const statusMessageDiv = document.getElementById('statusMessage');

// --- JWT Functions ---
function jwtDecode(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);

        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
            console.log('Token expirado');
            return null;
        }
        window.decodedToken = payload;
        return payload;
    } catch (e) {
        console.error("Erro ao decodificar JWT:", e);
        window.decodedToken = null;
        return null;
    }
}

// --- UI Functions ---
function updateUI(userData) {
    if (!userNameSpan || !userEmailSpan || !userPhotoImg || !userInfoDiv || !googleSignInButtonContainer) {
        console.error("Elementos da UI não encontrados");
        return;
    }
    if (userData) {
        userNameSpan.textContent = userData.name || 'N/A';
        userEmailSpan.textContent = userData.email || 'N/A';
        userPhotoImg.src = userData.picture || 'https://placehold.co/100x100/eeeeee/cccccc?text=Foto';
        userPhotoImg.onerror = () => { userPhotoImg.src = 'https://placehold.co/100x100/eeeeee/cccccc?text=Erro'; };
        userInfoDiv.classList.remove('hidden');
        googleSignInButtonContainer.classList.add('hidden');
    } else {
        userInfoDiv.classList.add('hidden');
        googleSignInButtonContainer.classList.remove('hidden');
        userNameSpan.textContent = '';
        userEmailSpan.textContent = '';
        userPhotoImg.src = '';
    }
}

// --- Server Communication ---
function verifyAndSaveUser(idToken, isPageLoad = false) {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'SUA_NOVA_URL_DO_APP_SCRIPT_AQUI') {
        console.warn('URL do Google Apps Script não configurada');
        if (!isPageLoad) {
            statusMessageDiv.textContent = 'Login local bem-sucedido, mas salvamento no servidor desabilitado';
            statusMessageDiv.style.color = 'orange';
        }
        return;
    }

    statusMessageDiv.textContent = isPageLoad 
        ? 'Verificando sessão com o servidor...' 
        : 'Verificando autenticação e salvando dados...';
    statusMessageDiv.style.color = isPageLoad ? 'grey' : 'blue';

    fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_token: idToken })
    })
    .then(() => {
        statusMessageDiv.textContent = isPageLoad 
            ? 'Sessão verificada com sucesso!' 
            : 'Dados enviados para o servidor!';
        statusMessageDiv.style.color = 'green';
        
        if (isPageLoad) {
            setTimeout(() => statusMessageDiv.textContent = '', 3000);
        }
    })
    .catch((error) => {
        console.error('Erro na comunicação com o servidor:', error);
        statusMessageDiv.textContent = `Erro de comunicação: ${error.message}`;
        statusMessageDiv.style.color = 'red';
        if (isPageLoad) logout();
    });
}

// --- Auth Handlers ---
function handleCredentialResponse(response) {
    const idToken = response.credential;
    const decodedPayload = jwtDecode(idToken);

    if (decodedPayload) {
        updateUI(decodedPayload);
        localStorage.setItem(USER_DATA_KEY, idToken);
        verifyAndSaveUser(idToken);
    } else {
        statusMessageDiv.textContent = 'Login inválido ou expirado';
        statusMessageDiv.style.color = 'red';
        logout();
    }
}

function logout() {
    window.decodedToken = null;
    localStorage.removeItem(USER_DATA_KEY);
    updateUI(null);
    statusMessageDiv.textContent = 'Sessão encerrada';
    statusMessageDiv.style.color = 'grey';
}

// --- Event Listeners ---
if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

document.getElementById('contaLink')?.addEventListener('click', function(e) {
    if (!localStorage.getItem(USER_DATA_KEY)) {
        e.preventDefault();
        statusMessageDiv.textContent = 'Faça login para acessar seu perfil!';
        statusMessageDiv.style.color = 'orange';
    }
});

document.getElementById('lojaLink')?.addEventListener('click', function(e) {
    if (!localStorage.getItem(USER_DATA_KEY)) {
        e.preventDefault();
        statusMessageDiv.textContent = 'Faça login para acessar sua loja!';
        statusMessageDiv.style.color = 'orange';
    }
});

// --- Initialization ---
window.addEventListener('load', () => {
    const storedToken = localStorage.getItem(USER_DATA_KEY);
    
    if (storedToken) {
        const decodedPayload = jwtDecode(storedToken);
        console.log("decodedPayload=",decodedPayload);
        if (decodedPayload) {
            updateUI(decodedPayload);
            verifyAndSaveUser(storedToken, true);
        } else {
            logout();
        }
    } else {
        updateUI(null);
    }

    if (GOOGLE_APPS_SCRIPT_URL === 'SUA_NOVA_URL_DO_APP_SCRIPT_AQUI') {
        console.warn('Configure a URL do Google Apps Script');
        if (!statusMessageDiv.textContent) {
            statusMessageDiv.textContent = 'Servidor não configurado - funcionalidade limitada';
            statusMessageDiv.style.color = 'orange';
        }
    }
});
