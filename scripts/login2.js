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
    console.log("teste   44444    - Evento load disparado");

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
                        // Opcional: Exibir mensagem de erro na UI
                        if (statusMessageDiv) statusMessageDiv.textContent = 'Erro: GOGOID do usuário não encontrado.';
                        return;
                    }

                    // Usando GET para buscar produtos por GOGOID
                  //  const scriptUrl = 'https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec'; // Substitua pela URL CORRETA do seu script implantado
                 //   const fetchUrl = `${scriptUrl}?action=getproductsbygogoid&googleUserId=${encodeURIComponent(gogoid)}`;
                    
                       const googleUserId = gogoid ;
                 console.log("googleUserId =(dentro do load):", googleUserId);
                       const scriptUrl = 'https://script.google.com/macros/s/AKfycbwRjL-iQVhiVWSPeTyb4AEkYm4tSPeAsL0J6AHqS_S5CtY7iR6xY6lOk1KbN7vY_NnY/exec';
                        const fetchUrl = `${scriptUrl}?action=getProdutosDaLoja&gogoid=${encodeURIComponent(googleUserId)}`;
                    const response = await fetch(fetchUrl);
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
                        const tabelaBody = produtosTableBody; // Usa a referência ao tbody
                        // Limpa todas as linhas exceto o cabeçalho (se o thead estiver separado)
                        // Se a primeira linha da tabela é o cabeçalho (<tr> dentro de <tbody>), limpe a partir da segunda linha
                         while(tabelaBody.rows.length > 0) { // Limpa todas as linhas do tbody
                             tabelaBody.deleteRow(0);
                         }


                        if (produtos && produtos.length > 0) {
                            produtos.forEach(produto => {
                                const newRow = tabelaBody.insertRow(-1); // Insere no tbody

                                // Célula de Imagens (replicando a estrutura de geprodutos.html)
                                const imgCell = newRow.insertCell(-1);
                                imgCell.style.verticalAlign = 'top';
                                imgCell.style.overflow = 'hidden';
                                imgCell.width = '74%'; // Ajuste as larguras conforme seu CSSol-´~b 0pBÇ:P:`^

                                const imgContainer = document.createElement('div');
                                // Use uma classe para os contêineres de imagem de produtos carregados
                                imgContainer.classList.add('product-images-carousel');
                                // Opcional: Adicionar um ID único para cada contêiner se necessário
                                // imgContainer.id = `product-images-${produto.ID_PRODUTO}`; // Assumindo que ID_PRODUTO existe

                                // Popula o contêiner de imagens usando a função de geprodutos.js
                                // Certifique-se de que loadImagesIntoContainer está acessível (definida em geprodutos.js e carregada depois)
                                if (window.loadImagesIntoContainer) {
                                     window.loadImagesIntoContainer(imgContainer, produto.IMAGENS);
                                } else {
                                     console.error("Função loadImagesIntoContainer não encontrada!");
                                     imgContainer.innerHTML = '<span>Erro ao carregar função de imagem.</span>';
                                }

                                imgCell.appendChild(imgContainer);


                                // Célula de Nome
                                const nomeCell = newRow.insertCell(-1);
                                nomeCell.width = '10%'; // Ajuste as larguras
                                nomeCell.textContent = produto.NOME || ''; // Use textContent para segurança

                                // Célula de Preço
                                const precoCell = newRow.insertCell(-1);
                                precoCell.width = '8%'; // Ajuste as larguras
                                precoCell.textContent = `R$ ${parseFloat(produto.PRECO || 0).toFixed(2).replace('.', ',')}`; // Formata como moeda

                                // Célula de Ações
                                const acoesCell = newRow.insertCell(-1);
                                acoesCell.width = '7%'; // Ajuste as larguras
                                acoesCell.style.verticalAlign = 'top'; // Alinha os botões no topo
                                acoesCell.style.overflow = 'hidden';
                                acoesCell.classList.add('acoes-container'); // Use a classe do seu HTML

                                // Adiciona os botões de ação (replicando a estrutura HTML)
                                acoesCell.innerHTML = `
                                      <div class="btnMoverCima btnMoverCima">🔺</div>
                                      <div class="btnMoverBaixo btnMoverBaixo">🔻</div>
                                      <div class="btnEditar btnEditarProduto">✏️ Editar</div>
                                      <div class="btnExcluir btnExcluirProduto">🗑️ Excluir</div>
                                `;

                                // Opcional: Adicionar event listeners aos botões de ação aqui ou usar delegação de eventos no tbody
                                // Exemplo: Adicionar ID do produto aos botões para referência
                                // acoesCell.querySelectorAll('div').forEach(btn => btn.dataset.productId = produto.ID_PRODUTO);

                            });
                        } else {
                             console.log("Nenhum produto encontrado para este usuário.");
                             // Adicionar uma linha na tabela indicando que não há produtos
                             const newRow = tabelaBody.insertRow(-1);
                             const noProductsCell = newRow.insertCell(-1);
                             noProductsCell.colSpan = 4; // Cobre todas as colunas
                             noProductsCell.style.textAlign = 'center';
                             noProductsCell.textContent = produtosResponse.message || 'Nenhum produto encontrado.';
                        }

                    } else {
                        // Trata casos de 'not_found' ou outros erros reportados pelo script GAS
                        console.warn("Erro ou status não sucesso retornado pelo script GAS:", produtosResponse.message);
                         const tabelaBody = produtosTableBody;
                         while(tabelaBody.rows.length > 0) { // Limpa todas as linhas do tbody
                             tabelaBody.deleteRow(0);
                         }
                         const newRow = tabelaBody.insertRow(-1);
                         const messageCell = newRow.insertCell(-1);
                         messageCell.colSpan = 4; // Cobre todas as colunas
                         messageCell.style.textAlign = 'center';
                         messageCell.style.color = 'red';
                         messageCell.textContent = produtosResponse.message || 'Erro ao carregar produtos.';
                    }


                } catch (error) {
                    console.error('Erro ao carregar produtos:', error);
                     const tabelaBody = produtosTableBody;
                     while(tabelaBody.rows.length > 0) { // Limpa todas as linhas do tbody
                         tabelaBody.deleteRow(0);
                     }
                     const newRow = tabelaBody.insertRow(-1);
                     const errorCell = newRow.insertCell(-1);
                     errorCell.colSpan = 4; // Cobre todas as colunas
                     errorCell.style.textAlign = 'center';
                     errorCell.style.color = 'red';
                     errorCell.textContent = `Erro ao carregar produtos: ${error.message}`;
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
// A função loadImagesIntoContainer e applyCarousel são esperadas de geprodutos.js
