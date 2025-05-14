 // --- Constantes e Variáveis Globais ---
        const USER_DATA_KEY = 'googleUserDataToken'; // Chave para buscar o token no localStorage
        window.decodedToken = null; // Para armazenar o token decodificado globalmente, se necessário

        // --- Elementos DOM ---
        const userInfoDiv = document.getElementById('userInfo');
        const userNameSpan = document.getElementById('userName');
        const userEmailSpan = document.getElementById('userEmail');
        const userPhotoImg = document.getElementById('userPhoto');
        const logoutButton = document.getElementById('logoutButton');
        const statusMessageDiv = document.getElementById('statusMessage');

        /**
         * Decodifica um token JWT.
         * @param {string} token O token JWT a ser decodificado.
         * @returns {object|null} O payload decodificado ou null se inválido/expirado.
         */
        function jwtDecode(token) {
            try {
                const base64Url = token.split('.')[1];
                if (!base64Url) {
                    console.error('Formato de token JWT inválido: sem payload.');
                    return null;
                }
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join(''));
                const payload = JSON.parse(jsonPayload);

                // Verifica a expiração do token
                const currentTime = Date.now() / 1000; // Tempo atual em segundos
                if (payload.exp && payload.exp < currentTime) {
                    console.log('Token JWT expirado.');
                    return null; // Token expirado
                }
                window.decodedToken = payload; // Armazena o token decodificado
                return payload;
            } catch (e) {
                console.error("Erro ao decodificar JWT:", e);
                window.decodedToken = null;
                return null;
            }
        }

        /**
         * Atualiza a interface do usuário com os dados do usuário.
         * @param {object|null} userData Objeto com dados do usuário (name, email, picture) ou null.
         */
        function updateUI(userData) {
            if (userData) {
                if (userNameSpan) userNameSpan.textContent = userData.name || 'N/A';
                if (userEmailSpan) userEmailSpan.textContent = userData.email || 'N/A';
                if (userPhotoImg) {
                    userPhotoImg.src = userData.picture || 'https://placehold.co/80x80/eeeeee/cccccc?text=Foto';
                    userPhotoImg.onerror = () => { userPhotoImg.src = 'https://placehold.co/80x80/eeeeee/cccccc?text=Erro'; };
                }
                if (userInfoDiv) userInfoDiv.classList.remove('hidden');
            } else {
                // Se não há dados do usuário, teoricamente já deveria ter redirecionado.
                // Mas, por segurança, esconde a área de info do usuário.
                if (userInfoDiv) userInfoDiv.classList.add('hidden');
            }
        }

        /**
         * Realiza o logout do usuário.
         */
        function logout() {
            localStorage.removeItem(USER_DATA_KEY);
            window.decodedToken = null;
            // Redireciona para a página de login (index.html)
            window.location.href = 'index.html';
        }

        // --- Inicialização da Página ---
        window.addEventListener('load', () => {
         console.log("teste3");
            const storedToken = localStorage.getItem(USER_DATA_KEY);

            if (storedToken) {
                const decodedPayload = jwtDecode(storedToken);
                if (decodedPayload) {
                    // Usuário está logado e token é válido
                    updateUI(decodedPayload);
                    if(statusMessageDiv) statusMessageDiv.textContent = 'Sessão carregada localmente.';
                } else {
                    // Token inválido ou expirado
                    if(statusMessageDiv) statusMessageDiv.textContent = 'Sessão inválida ou expirada. Redirecionando...';
                    logout(); // Limpa o token inválido e redireciona
                }
            } else {
                // Usuário não está logado
                if(statusMessageDiv) statusMessageDiv.textContent = 'Nenhuma sessão encontrada. Redirecionando para login...';
                // Atraso para o usuário ver a mensagem antes de redirecionar (opcional)
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }

            // Adiciona listener para o botão de logout
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }

// === Carregar Produtos ao Iniciar ===
document.addEventListener('DOMContentLoaded', async () => {
  console.log("gogoid2=",gogoid);
    try {
        const gogoid = window.decodedToken?.sub;
         console.log("gogoid3=",gogoid);
        if (!gogoid) return;
        const response = await fetch(`https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec?action=get&gogoid=${encodeURIComponent(gogoid)}`, {
            method: 'GET',
            mode: 'cors'
        });
  console.log("gogoid4=",gogoid);
        const produtos = await response.json();
        const tabela = document.getElementById('Tabeladeprodutos');

        // Limpar linhas existentes (exceto cabeçalho)
        while(tabela.rows.length > 1) tabela.deleteRow(1);

        // Popular tabela
        produtos.forEach(produto => {
            const newRow = tabela.insertRow(-1);
            
            // Colunas (ajuste conforme seu layout)
            newRow.innerHTML = `
                <td width="74%">
                    <div class="textstyle5">
                        ${produto.IMAGENS.split(', ').map(img => `<img src="${img}" style="height:50px; margin:2px;">`).join('')}
                    </div>
                </td>
                <td width="10%">${produto.NOME}</td>
                <td width="8%">R$ ${produto.PRECO}</td>
                <td width="7%">
                    <div class="acoes-container">
                        <div class="btnMoverCima">🔺</div>
                        <div class="btnMoverBaixo">🔻</div>
                        <div class="btnEditar">✏️</div>
                        <div class="btnExcluir">🗑️</div>
                    </div>
                </td>
            `;
        });

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
});

         


         
        });//fecha window load









