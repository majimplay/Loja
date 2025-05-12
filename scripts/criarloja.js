
        // --- Constantes e Variáveis Globais Unificadas ---
        const USER_DATA_KEY = 'googleUserDataToken';
        const STORE_DATA_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4BYyPgFBnLL6aX2HhtARtDR_0uxQO-0m04j9C76s9XuvuQzTCOQKESMZK9pzpaNtE/exec'; // URL para salvar/buscar dados da loja
        const IMG_BB_API_KEY = '43ff22682bbe91ea89a32047a821bae8'; // Sua chave da API ImgBB

        let currentGoogleUserId = null;
        window.decodedUserToken = null;
        let logoFile = null;
        let backgroundFile = null;
        // --- Elementos DOM (Cabeçalho) ---
        const userInfoDiv = document.getElementById('userInfo');
        const userNameSpan = document.getElementById('userName');
        const userEmailSpan = document.getElementById('userEmail');
        const userPhotoImg = document.getElementById('userPhoto');
        const logoutButton = document.getElementById('logoutButton');
        const statusMessageHeaderDiv = document.getElementById('statusMessageHeader');

        // --- Elementos DOM (Página Criar Loja) ---
        const statusMessageStoreDiv = document.getElementById('statusMessageStore');
        const welcomeLabelStore = document.getElementById('welcome_label_store');
        const storeNameInput = document.getElementById('store_name_input');
        const storeCepInput = document.getElementById('store_cep_input');
        const saveStoreButton = document.getElementById('save_button');
        const statusSaveDiv = document.getElementById('statusSave');

        const orderCountText = document.getElementById('order_count_text');
        const ordersButton = document.getElementById('orders_button');
        const productsButton = document.getElementById('products_button');

        const logoUploadArea = document.getElementById('logo_upload_area');
        const logoPreviewImg = document.getElementById('logo_upload_image_preview');
        const backgroundUploadArea = document.getElementById('background_upload_area');
        const backgroundPreviewImg = document.getElementById('background_upload_image_preview');

        // --- Funções de Autenticação e UI (Cabeçalho) ---
        function jwtDecode(token) {
            try {
                if (!token) return null;
                const parts = token.split('.');
                if (parts.length !== 3) { console.error("Token JWT inválido."); return null; }
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                const currentTime = Date.now() / 1000;
                if (payload.exp && payload.exp < currentTime) { console.log('Token expirado.'); return null; }
                if (!payload.sub) { console.error("Token sem 'sub'."); return null; }
                window.decodedUserToken = payload;
                return payload;
            } catch (e) { console.error("Erro ao decodificar JWT:", e); return null; }
        }

        function updateHeaderUI(userData) {
            if (userData) {
                if (userNameSpan) userNameSpan.textContent = userData.name || 'N/A';
                if (userEmailSpan) userEmailSpan.textContent = userData.email || 'N/A';
                if (userPhotoImg) {
                    userPhotoImg.src = userData.picture || 'https://placehold.co/100x100/eeeeee/cccccc?text=Foto';
                    userPhotoImg.onerror = () => { userPhotoImg.src = 'https://placehold.co/100x100/eeeeee/cccccc?text=Erro'; };
                }
                if (userInfoDiv) userInfoDiv.classList.remove('hidden');
            } else {
                if (userInfoDiv) userInfoDiv.classList.add('hidden');
            }
        }

        function logoutUser() {
            localStorage.removeItem(USER_DATA_KEY);
            window.decodedUserToken = null;
            currentGoogleUserId = null;
            if (statusMessageHeaderDiv) statusMessageHeaderDiv.textContent = 'Você foi desconectado. Redirecionando...';
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        }

        // --- Funções da Página Criar Loja ---

        /**
         * Faz upload de um arquivo para o ImgBB.
         * @param {File} file O arquivo de imagem.
         * @param {string} apiKey Sua chave da API do ImgBB.
         * @returns {Promise<string|null>} A URL da imagem no ImgBB ou null em caso de erro.
         */
        async function uploadToImgBB(file, apiKey) {
            if (!apiKey || apiKey === 'SUA_CHAVE_API_IMG_BB_AQUI') {
                alert('Chave da API do ImgBB não configurada. O upload real não será feito.');
                console.warn('ImgBB API Key not configured.');
                return null; // Retorna null se a chave não estiver configurada
            }
            const formData = new FormData();
            formData.append('image', file);
             formData.append('album', '2SGYcL'); // Opcional: ID do álbum no ImgBB

            if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = `Enviando ${file.name}...`;

            try {
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (data.success) {
                    console.log('ImgBB Upload Response:', data);
                    if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = 'Imagem enviada com sucesso!';
                    return data.data.url; // Retorna a URL da imagem
                } else {
                    console.error('Erro no upload para ImgBB:', data.error.message);
                    alert(`Erro ao enviar imagem para o ImgBB: ${data.error.message}`);
                    if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = `Erro no upload: ${data.error.message}`;
                    return null;
                }
            } catch (error) {
                console.error('Erro de rede ao enviar para ImgBB:', error);
                alert('Erro de rede ao enviar imagem para o ImgBB. Verifique sua conexão.');
                if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = 'Erro de rede no upload.';
                return null;
            }
        }


        /**
         * Configura uma área de upload de imagem (logo ou fundo).
         * @param {HTMLElement} areaElement O elemento da área de upload (div).
         * @param {HTMLImageElement} previewElement O elemento img para mostrar a pré-visualização.
         * @param {string} type Tipo de imagem ('logo' ou 'background') para feedback.
         */
     function setupImageUpload(areaElement, previewElement, type) {
        if (!areaElement || !previewElement) return;

        const processFile = (file) => {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
                // Armazena o arquivo para upload posterior
                if (type === 'logo') logoFile = file;
                else backgroundFile = file;
            };
            reader.readAsDataURL(file);

            statusMessageStoreDiv.textContent = `Imagem ${type} selecionada. Clique em Salvar para enviar.`;
        };
         
           // Eventos de Clique
        areaElement.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                if (e.target.files[0]) processFile(e.target.files[0]);
            };
            input.click();
        });
         
            // Eventos de Drag and Drop
        areaElement.addEventListener('dragover', (e) => e.preventDefault());
        areaElement.addEventListener('dragleave', () => areaElement.style.borderColor = '#ccc');
        areaElement.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
        });
    }


        /**
         * Carrega os dados da loja do Google Sheet.
         */
        async function loadStoreData() {
            if (!currentGoogleUserId) {
                if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = "ID do usuário não encontrado para carregar dados da loja.";
                return;
            }
            if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = "Carregando dados da loja...";

            const fetchUrl = `${STORE_DATA_SCRIPT_URL}?action=getStore&userId=${encodeURIComponent(currentGoogleUserId)}`;
            console.log("Buscando dados da loja em:", fetchUrl);

            try {
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`Erro na rede: ${response.status}`);
                const result = await response.json();
                console.log("Dados da loja recebidos:", result);

                if (result.status === 'success' && result.data) {
                    const data = result.data;
                    if (storeNameInput) storeNameInput.value = data.storeName || '';
                    if (storeCepInput) storeCepInput.value = data.storeCep || '';
                    if (logoPreviewImg) {
                        logoPreviewImg.src = data.logoUrl || 'rc_images/drop_here.png';
                        logoPreviewImg.dataset.imgbbUrl = data.logoUrl || '';
                    }
                    if (backgroundPreviewImg) {
                        backgroundPreviewImg.src = data.backgroundUrl || 'rc_images/drop_here.png';
                        backgroundPreviewImg.dataset.imgbbUrl = data.backgroundUrl || '';
                    }
                    if (welcomeLabelStore && data.storeName) {
                        welcomeLabelStore.innerHTML = `Editando sua loja: <span style="color:#A2BF3F;">${data.storeName}</span>`;
                    } else if (welcomeLabelStore) {
                        const userName = window.decodedUserToken?.name || window.decodedUserToken?.email || 'usuário';
                        welcomeLabelStore.innerHTML = `Bem-vindo, ${userName}! Crie sua loja.`;
                    }
                    if (orderCountText) orderCountText.textContent = `Você tem (${data.orderCount || 0}) pedidos`;
                    if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = "Dados da loja carregados!";
                } else if (result.status === 'not_found') {
                    if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = "Nenhuma loja encontrada. Preencha os dados para criar uma.";
                    const userName = window.decodedUserToken?.name || window.decodedUserToken?.email || 'usuário';
                    if (welcomeLabelStore) welcomeLabelStore.innerHTML = `Bem-vindo, ${userName}! Crie sua loja.`;
                } else {
                    if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = `Erro ao carregar dados: ${result.message || 'Resposta inesperada.'}`;
                }
            } catch (error) {
                console.error("Erro ao carregar dados da loja:", error);
                if (statusMessageStoreDiv) statusMessageStoreDiv.textContent = `Erro de conexão ao carregar dados: ${error.message}`;
            }
        }

        /**
         * Salva os dados da loja no Google Sheet.
         */
   // --- Função de Salvamento Modificada ---
    async function handleSaveStoreData() {
        if (!currentGoogleUserId) {
            alert('Sessão inválida. Faça login novamente.');
            return;
        }
        if (!storeNameInput.value.trim() || !storeCepInput.value.trim()) {
            alert('Nome da loja e CEP são obrigatórios!');
            return;
        }

        let logoUrlToSave = logoPreviewImg.dataset.imgbbUrl || '';
        let backgroundUrlToSave = backgroundPreviewImg.dataset.imgbbUrl || '';

        try {
            // Upload do Logo (se houver novo arquivo)
            if (logoFile) {
                statusMessageStoreDiv.textContent = "Enviando logo...";
                logoUrlToSave = await uploadToImgBB(logoFile, IMG_BB_API_KEY);
                logoPreviewImg.dataset.imgbbUrl = logoUrlToSave;
                logoFile = null; // Limpa após upload
            }

            // Upload do Background (se houver novo arquivo)
            if (backgroundFile) {
                statusMessageStoreDiv.textContent = "Enviando background...";
                backgroundUrlToSave = await uploadToImgBB(backgroundFile, IMG_BB_API_KEY);
                backgroundPreviewImg.dataset.imgbbUrl = backgroundUrlToSave;
                backgroundFile = null; // Limpa após upload
            }

            // Prepara dados para salvar
            const storeData = {
                action: 'saveStore',
                userId: currentGoogleUserId,
                userEmail: window.decodedUserToken?.email || '',
                storeName: storeNameInput.value.trim(),
                storeCep: storeCepInput.value.trim(),
                logoUrl: logoUrlToSave,
                backgroundUrl: backgroundUrlToSave
            };

            // Envia para Google Sheet
            statusSaveDiv.textContent = 'Salvando...';
            saveStoreButton.disabled = true;
            
            const response = await fetch(STORE_DATA_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script Web Apps geralmente requerem 'no-cors' para POST simples
                                     // ou precisam de tratamento de CORS e resposta JSON adequada no script.
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storeData)
            });

            statusSaveDiv.textContent = 'Dados salvos com sucesso!';
            alert('Loja atualizada!');
            loadStoreData(); // Recarrega dados atualizados

        } catch (error) {
            console.error('Erro ao salvar:', error);
            statusSaveDiv.textContent = `Erro: ${error.message}`;
            alert('Falha ao salvar dados.');
        } finally {
            saveStoreButton.disabled = false;
        }
    }

        // --- Inicialização da Página ---
        window.addEventListener('load', () => {
            console.log("Página Criar/Gerenciar Loja carregada.");
            const storedToken = localStorage.getItem(USER_DATA_KEY);

            if (saveStoreButton) saveStoreButton.disabled = true;
            // Desabilitar outros botões que dependem de loja existente
            if (ordersButton) ordersButton.disabled = true;
            if (productsButton) productsButton.disabled = true;


            if (storedToken) {
                const decodedPayload = jwtDecode(storedToken);
                if (decodedPayload && decodedPayload.sub) {
                    currentGoogleUserId = decodedPayload.sub;
                    console.log("Usuário logado. ID:", currentGoogleUserId);

                    updateHeaderUI(decodedPayload);
                    if (statusMessageHeaderDiv) statusMessageHeaderDiv.textContent = 'Sessão carregada.';

                    // Configurar uploads de imagem
                    setupImageUpload(logoUploadArea, logoPreviewImg, 'logo');
                    setupImageUpload(backgroundUploadArea, backgroundPreviewImg, 'fundo');
                    
                    loadStoreData(); // Carrega dados da loja existentes

                    if (saveStoreButton) {
                        saveStoreButton.disabled = false;
                        saveStoreButton.addEventListener('click', handleSaveStoreData);
                    }
                    // Habilitar outros botões se a loja já existir (pode ser feito dentro de loadStoreData)
                    if (ordersButton) ordersButton.disabled = false; // Simplificado por agora
                    if (productsButton) productsButton.disabled = false; // Simplificado

                } else {
                    if (statusMessageHeaderDiv) statusMessageHeaderDiv.textContent = 'Sessão inválida ou expirada. Redirecionando...';
                    logoutUser();
                }
            } else {
                if (statusMessageHeaderDiv) statusMessageHeaderDiv.textContent = 'Nenhuma sessão encontrada. Redirecionando para login...';
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            }

            if (logoutButton) {
                logoutButton.addEventListener('click', logoutUser);
            }

            // Listeners para botões de Pedidos e Produtos (apenas logs por enquanto)
            if(ordersButton) {
                ordersButton.addEventListener('click', () => {
                    alert('Funcionalidade "Ver Pedidos" ainda não implementada nesta página.');
                    console.log('Botão Ver Pedidos clicado.');
                });
            }
            if(productsButton) {
                productsButton.addEventListener('click', () => {
                    alert('Funcionalidade "Gerenciar Produtos" ainda não implementada nesta página.');
                    console.log('Botão Gerenciar Produtos clicado.');
                });
            }
        });
