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
const produtosTableBody = document.querySelector('#Tabeladeprodutos tbody'); // Seleciona o corpo da tabela

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

        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
            console.log('Token JWT expirado.');
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
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
    }
}

/**
 * Realiza o logout do usuário.
 */
function logout() {
    localStorage.removeItem(USER_DATA_KEY);
    window.decodedToken = null;
    window.location.href = 'index.html';
}

// --- Inicialização da Página ---
window.addEventListener('load', () => {
    console.log("Evento load disparado.   2222222 Iniciando verificações...");

    const storedToken = localStorage.getItem(USER_DATA_KEY);

    if (storedToken) {
        const decodedPayload = jwtDecode(storedToken);
        if (decodedPayload) {
            updateUI(decodedPayload);
            if (statusMessageDiv) statusMessageDiv.textContent = 'Sessão carregada localmente. Buscando produtos...';
            console.log("Token válido encontrado. Payload:", decodedPayload);

            (async () => {
                try {
                    const gogoid = window.decodedToken?.sub; // gogoid do USUÁRIO/LOJA
                    console.log("gogoid para buscar produtos da loja:", gogoid);

                    if (!gogoid) {
                        console.error("gogoid do usuário/loja não encontrado no token!");
                        if (statusMessageDiv) statusMessageDiv.textContent = 'Erro: ID do usuário/loja não encontrado para buscar produtos.';
                        return;
                    }

                    // Limpar tabela ANTES de fazer o fetch ou mostrar mensagem de erro de fetch
                    if (produtosTableBody) {
                        while(produtosTableBody.rows.length > 0) {
                            produtosTableBody.deleteRow(0);
                        }
                    } else {
                        console.error("Elemento tbody da tabela de produtos não encontrado!");
                        if (statusMessageDiv) statusMessageDiv.textContent = 'Erro: Tabela de produtos não encontrada na página.';
                        return;
                    }

                    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec'; // MANTENHA SUA URL CORRETA
                    const fetchUrl = `${scriptUrl}?action=getProdutosDaLoja&gogoid=${encodeURIComponent(gogoid)}`;
                    console.log("Fazendo fetch para URL:", fetchUrl);

                    const response = await fetch(fetchUrl);
                    console.log("Resposta bruta do servidor (objeto Response):", response);

                    const responseText = await response.text();
                    console.log("Texto bruto da resposta do servidor (antes do parse JSON):", responseText);

                    if (!response.ok) {
                        console.error(`Erro HTTP: ${response.status} - ${response.statusText}. Conteúdo: ${responseText}`);
                        throw new Error(`Erro HTTP: ${response.status} - ${responseText}`);
                    }
                    
                    const produtosResponse = JSON.parse(responseText);
                    console.log("Resposta JSON parseada:", produtosResponse);

                    if (produtosResponse.status === 'success' && produtosResponse.data && produtosResponse.data.produtos) {
                        const produtos = produtosResponse.data.produtos;
                        console.log(`Produtos carregados da loja "${produtosResponse.data.loja || 'N/A'}":`, produtos);
                        if (statusMessageDiv) statusMessageDiv.textContent = `Produtos da loja "${produtosResponse.data.loja || 'N/A'}" carregados.`;

                        if (produtos && produtos.length > 0) {
                            produtos.forEach(produto => {
                                const newRow = produtosTableBody.insertRow(-1); // Insere no final da tabela

                                // Célula de Imagens
                                const imgCell = newRow.insertCell(-1);
                                imgCell.style.verticalAlign = 'top';
                                imgCell.style.overflow = 'hidden';
                                imgCell.Max-height = '332px';
                                imgCell.width = '74%'; // Ajuste a largura conforme necessário
                                const imgContainer = document.createElement('div');
                                imgContainer.classList.add('product-images-carousel');
                                if (window.loadImagesIntoContainer && typeof produto.IMAGENS === 'string') {
                                     window.loadImagesIntoContainer(imgContainer, produto.IMAGENS);
                                } else {
                                     console.warn("Função loadImagesIntoContainer não encontrada ou IMAGENS não é string. Produto ID:", produto.ID_PRODUTO);
                                     imgContainer.innerHTML = `<span>${produto.IMAGENS ? 'Erro ao carregar imagens' : 'Sem imagens'}</span>`;
                                }
                                imgCell.appendChild(imgContainer);

                                // Célula de Nome e Preço (combinadas)
                                const nomePrecoCell = newRow.insertCell(-1);
                                nomePrecoCell.width = '18%'; // Ajuste a largura conforme necessário
                                nomePrecoCell.style.verticalAlign = 'top'; // Alinha o conteúdo da célula ao topo
                                nomePrecoCell.innerHTML = `
                                    <textarea class="CAXADETEXTONOMEPRODUTO" rows="3" style="width: 95%; box-sizing: border-box; margin-bottom: 5px;" placeholder="Nome do Produto">${produto.NOME || ''}</textarea>
                                    <input type="text" class="CAXADETEXTOPRECOPRODUTO" style="width: 95%; box-sizing: border-box;" value="R$ ${parseFloat(produto.PRECO || 0).toFixed(2).replace('.', ',')}" placeholder="Preço">
                                `;
                                
                                // Célula de Ações
                                const acoesCell = newRow.insertCell(-1);
                                acoesCell.width = '7%'; // Ajuste a largura conforme necessário
                                acoesCell.style.verticalAlign = 'top';
                                acoesCell.style.overflow = 'hidden';
                                acoesCell.classList.add('acoes-container');
                                acoesCell.innerHTML = `
                                      <div class="btnMoverCima">🔺<br></div>
                                      <div class="btnMoverBaixo">🔻</div>
                                      <div class="btnEditar btnEditarProduto" data-product-id="${produto.ID_PRODUTO || ''}">✏️<br> </div>
                                      <div class="btnExcluir btnExcluirProduto" data-product-id="${produto.ID_PRODUTO || ''}">🗑️ </div>
                                `;
                            });
                        } else {
                             console.log("Nenhum produto encontrado para esta loja, embora a resposta tenha sido 'success'. Mensagem:", produtosResponse.message);
                             const newRow = produtosTableBody.insertRow(-1);
                             const noProductsCell = newRow.insertCell(-1);
                             noProductsCell.colSpan = 3; // Ajustado para 3 colunas
                             noProductsCell.style.textAlign = 'center';
                             noProductsCell.textContent = produtosResponse.message || 'Nenhum produto cadastrado para esta loja.';
                             if (statusMessageDiv) statusMessageDiv.textContent = produtosResponse.message || 'Nenhum produto cadastrado para esta loja.';
                        }

                    } else { // Trata 'not_found', 'error' ou outros status inesperados
                        console.warn("Status não 'success' ou dados de produtos ausentes. Status:", produtosResponse.status, "Mensagem:", produtosResponse.message);
                        const newRow = produtosTableBody.insertRow(-1);
                        const messageCell = newRow.insertCell(-1);
                        messageCell.colSpan = 3; // Ajustado para 3 colunas
                        messageCell.style.textAlign = 'center';
                        messageCell.style.color = (produtosResponse.status === 'error' ? 'red' : 'orange');
                        messageCell.textContent = produtosResponse.message || 'Não foi possível carregar os produtos.';
                        if (statusMessageDiv) statusMessageDiv.textContent = produtosResponse.message || 'Não foi possível carregar os produtos.';
                    }

                } catch (error) {
                    console.error('Erro CRÍTICO ao carregar ou processar produtos:', error);
                    // A tabela já foi limpa antes do try, então apenas adicionamos a mensagem de erro
                    if (produtosTableBody) { // Garante que tbody exista
                        const newRow = produtosTableBody.insertRow(-1);
                        const errorCell = newRow.insertCell(-1);
                        errorCell.colSpan = 3; // Ajustado para 3 colunas
                        errorCell.style.textAlign = 'center';
                        errorCell.style.color = 'red';
                        errorCell.textContent = `Erro ao carregar produtos: ${error.message}`;
                    }
                    if (statusMessageDiv) statusMessageDiv.textContent = `Erro ao carregar produtos: ${error.message}`;
                }
            })();

        } else {
            if (statusMessageDiv) statusMessageDiv.textContent = 'Sessão inválida ou expirada. Redirecionando para login...';
            console.log('Token JWT inválido ou expirado. Fazendo logout.');
            logout();
        }
    } else {
        if (statusMessageDiv) statusMessageDiv.textContent = 'Nenhuma sessão encontrada. Redirecionando para login...';
        console.log('Nenhum token encontrado no localStorage. Redirecionando para login.');
        setTimeout(() => window.location.href = 'index.html', 1500);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});
