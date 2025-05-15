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
    console.log("Evento load disparado. teste 888888 Iniciando verificações...");

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

                    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec'; // MANTENHA SUA URL CORRETA
                    const fetchUrl = `${scriptUrl}?action=getProdutosDaLoja&gogoid=${encodeURIComponent(gogoid)}`;
                    console.log("Fazendo fetch para URL:", fetchUrl);

                    const response = await fetch(fetchUrl);
                    console.log("Resposta bruta do servidor (objeto Response):", response);

                    // Ler o corpo da resposta como texto PRIMEIRO para depuração
                    const responseText = await response.text();
                    console.log("Texto bruto da resposta do servidor (antes do parse JSON):", responseText);

                    if (!response.ok) {
                        // O responseText já foi lido, então ele contém a mensagem de erro do servidor
                        console.error(`Erro HTTP: ${response.status} - ${response.statusText}. Conteúdo: ${responseText}`);
                        throw new Error(`Erro HTTP: ${response.status} - ${responseText}`);
                    }
                    
                    // Tentar parsear o texto que já foi lido
                    const produtosResponse = JSON.parse(responseText);
                    console.log("Resposta JSON parseada:", produtosResponse);


                    // Limpar tabela antes de popular ou mostrar mensagem
                    if (produtosTableBody) {
                     //   while(produtosTableBody.rows.length > 0) {
                     //       produtosTableBody.deleteRow(0);
                      //  }
                    } else {
                        console.error("Elemento tbody da tabela de produtos não encontrado!");
                        if (statusMessageDiv) statusMessageDiv.textContent = 'Erro: Tabela de produtos não encontrada na página.';
                        return;
                    }

                    if (produtosResponse.status === 'success' && produtosResponse.data && produtosResponse.data.produtos) {
                        const produtos = produtosResponse.data.produtos;
                        console.log(`Produtos carregados da loja "${produtosResponse.data.loja || 'N/A'}":`, produtos);
                        if (statusMessageDiv) statusMessageDiv.textContent = `Produtos da loja "${produtosResponse.data.loja || 'N/A'}" carregados.`;

                        if (produtos && produtos.length > 0) {
                            produtos.forEach(produto => {
                                const newRow = produtosTableBody.insertRow(-1);

                                // Célula de Imagens
                                const imgCell = newRow.insertCell(-1);
                                imgCell.style.verticalAlign = 'top';
                                imgCell.style.overflow = 'hidden';
                                imgCell.width = '74%';
                                const imgContainer = document.createElement('div');
                                imgContainer.classList.add('product-images-carousel');
                                if (window.loadImagesIntoContainer && typeof produto.IMAGENS === 'string') {
                                     window.loadImagesIntoContainer(imgContainer, produto.IMAGENS);
                                } else {
                                     console.warn("Função loadImagesIntoContainer não encontrada ou IMAGENS não é string. Produto ID:", produto.ID_PRODUTO);
                                     imgContainer.innerHTML = `<span>${produto.IMAGENS ? 'Erro ao carregar imagens' : 'Sem imagens'}</span>`;
                                }
                                imgCell.appendChild(imgContainer);

                                // Célula de Nome
                                const nomeCell = newRow.insertCell(-1);
                                nomeCell.width = '18%';
                                //nomeCell.textContent = produto.NOME || 'Sem nome'<br>,`R$ ${parseFloat(produto.PRECO || 0).toFixed(2).replace('.', ',')}`;;
                                <textarea  class="CAXADETEXTONOMEPRODUTO"  rows="3"   placeholder="Nome do produto" >${produto.NOME || ''}</textarea>
                                <br>
                                <input   type="text"     class="CAXADETEXTOPRECOPRODUTO"  value="R$ ${parseFloat(produto.PRECO || 0).toFixed(2).replace('.', ',')}"  placeholder="Preço">
                              
                                // Célula de Preço
                                //const precoCell = newRow.insertCell(-1);
                                //precoCell.width = '8%';
                                //precoCell.textContent = `R$ ${parseFloat(produto.PRECO || 0).toFixed(2).replace('.', ',')}`;

                                // Célula de Ações
                                const acoesCell = newRow.insertCell(-1);
                                acoesCell.width = '7%';
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
                             noProductsCell.colSpan = 4;
                             noProductsCell.style.textAlign = 'center';
                             noProductsCell.textContent = produtosResponse.message || 'Nenhum produto cadastrado para esta loja.';
                             if (statusMessageDiv) statusMessageDiv.textContent = produtosResponse.message || 'Nenhum produto cadastrado para esta loja.';
                        }

                    } else { // Trata 'not_found', 'error' ou outros status inesperados
                        console.warn("Status não 'success' ou dados de produtos ausentes. Status:", produtosResponse.status, "Mensagem:", produtosResponse.message);
                        const newRow = produtosTableBody.insertRow(-1);
                        const messageCell = newRow.insertCell(-1);
                        messageCell.colSpan = 4;
                        messageCell.style.textAlign = 'center';
                        messageCell.style.color = (produtosResponse.status === 'error' ? 'red' : 'orange');
                        messageCell.textContent = produtosResponse.message || 'Não foi possível carregar os produtos.';
                        if (statusMessageDiv) statusMessageDiv.textContent = produtosResponse.message || 'Não foi possível carregar os produtos.';
                    }

                } catch (error) {
                    console.error('Erro CRÍTICO ao carregar ou processar produtos:', error);
                    if (produtosTableBody) { // Garante que tbody exista antes de tentar limpar
                        while(produtosTableBody.rows.length > 0) { produtosTableBody.deleteRow(0); }
                        const newRow = produtosTableBody.insertRow(-1);
                        const errorCell = newRow.insertCell(-1);
                        errorCell.colSpan = 4;
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
