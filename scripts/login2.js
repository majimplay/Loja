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
    console.log("teste   99999    - Evento load disparado");

    const storedToken = localStorage.getItem(USER_DATA_KEY);

    // Verificação do Token
    if (storedToken) {
        const decodedPayload = jwtDecode(storedToken);
        if (decodedPayload) {
            updateUI(decodedPayload);
            statusMessageDiv.textContent = 'Sessão carregada localmente.';

            // === Carregar Produtos APÓS validação do token ===
            (async () => {
                try {
                    const gogoid = window.decodedToken?.sub;
                    console.log("gogoid3 (dentro do load):", gogoid);

                    if (!gogoid) {
                        console.error("GOGOID não encontrado!");
                        return;
                    }

                    // ** ALTERAÇÃO AQUI: Usando GET e os parâmetros corretos **
                    // A URL deve incluir a action e o googleUserId como parâmetros de query
                    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec'; // Substitua pela URL CORRETA do seu script implantado
                    const fetchUrl = `${scriptUrl}?action=getproductsbygogoid&googleUserId=${encodeURIComponent(gogoid)}`;

                    const response = await fetch(fetchUrl); // Método padrão é GET
                    console.log("Resposta do servidor:", response);

                    // Verifica se a resposta é OK antes de tentar parsear como JSON
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
                    }

                    const produtosResponse = await response.json(); // Espera um objeto JSON

                    // Verifica o status dentro do payload JSON retornado pelo Google Apps Script
                    if (produtosResponse.status === 'success') {
                         const produtos = produtosResponse.productsData; // Acessa o array de produtos
                         console.log("Produtos carregados:", produtos);

                        // Popular tabela...
                        const tabela = document.getElementById('Tabeladeprodutos');
                        // Limpa todas as linhas exceto o cabeçalho
                        while(tabela.rows.length > 1) {
                            tabela.deleteRow(1);
                        }

                        if (produtos && produtos.length > 0) {
                            produtos.forEach(produto => {
                                const newRow = tabela.insertRow(-1);
                                // Certifique-se de que os nomes das propriedades (produto.IMAGENS, produto.NOME, produto.PRECO)
                                // correspondem exatamente aos cabeçalhos das colunas na sua planilha 'Produtos'
                                newRow.innerHTML = `
                                    <td width="74%">
                                        <div class="textstyle5">
                                            ${produto.IMAGENS ? String(produto.IMAGENS).split(',').map(img => `<img src="${img.trim()}" style="height:50px; margin:2px;">`).join('') : ''}
                                        </div>
                                    </td>
                                    <td width="10%">${produto.NOME || ''}</td>
                                    <td width="8%">R$ ${produto.PRECO || '0.00'}</td>
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
                        } else {
                             console.log("Nenhum produto encontrado para este usuário.");
                             // Opcional: Adicionar uma linha na tabela indicando que não há produtos
                             const newRow = tabela.insertRow(-1);
                             newRow.innerHTML = `<td colspan="4" style="text-align:center;">Nenhum produto encontrado.</td>`;
                        }

                    } else {
                        // Trata casos de 'not_found' ou outros erros reportados pelo script GAS
                        console.warn("Erro ou status não sucesso retornado pelo script GAS:", produtosResponse.message);
                         const tabela = document.getElementById('Tabeladeprodutos');
                         while(tabela.rows.length > 1) tabela.deleteRow(1); // Limpa a tabela
                         const newRow = tabela.insertRow(-1);
                         newRow.innerHTML = `<td colspan="4" style="text-align:center;">${produtosResponse.message || 'Erro ao carregar produtos.'}</td>`;
                    }


                } catch (error) {
                    console.error('Erro ao carregar produtos:', error);
                     const tabela = document.getElementById('Tabeladeprodutos');
                     while(tabela.rows.length > 1) tabela.deleteRow(1); // Limpa a tabela
                     const newRow = tabela.insertRow(-1);
                     newRow.innerHTML = `<td colspan="4" style="text-align:center; color: red;">Erro ao carregar produtos: ${error.message}</td>`;
                }
            })();

        } else {
            statusMessageDiv.textContent = 'Sessão inválida ou expirada. Redirecionando...';
            logout();
        }
    } else {
        statusMessageDiv.textContent = 'Nenhuma sessão encontrada. Redirecionando para login...';
        setTimeout(() => window.location.href = 'index.html', 1500);
    }

    // Listener para logout
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});// Fecha window.addEventListener('load')

// Note: As funções jwtDecode, updateUI, logout devem estar definidas globalmente ou acessíveis neste escopo.
// Certifique-se de que a variável 'gogoid' está sendo corretamente obtida do token decodificado.
