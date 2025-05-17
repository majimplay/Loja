  // Vetor para armazenar as imagens A SEREM adicionadas (como Data URLs)
    let imagesToAdd = [];

    // Elementos DOM
    const imageDropArea = document.getElementById('imagedrop_here');
    // Contêiner para imagens A SEREM adicionadas
    const imagesToAddContainer = document.getElementById('container_imagens_adicionar');
    // Contêiner para imagens DOS PRODUTOS SALVOS (o original no HTML)
    const savedImagesContainer = document.getElementById('container_imagens');


    // Função para exibir as imagens A SEREM adicionadas no NOVO contêiner
    function displayImagesToAdd() {
        // Limpa o conteúdo atual do contêiner de adição
        imagesToAddContainer.innerHTML = '';

        if (imagesToAdd.length > 0) {
            // Se houver imagens, mostra o contêiner
            imagesToAddContainer.style.display = 'flex'; // Usa flex para o carrossel
            // Itera sobre o vetor de imagens e cria elementos <img> para exibição
            imagesToAdd.forEach(imageDataUrl => {
                const imgElement = document.createElement('img');
                imgElement.src = imageDataUrl;
                // Pode adicionar classes específicas se quiser estilos diferentes das imagens salvas
                // imgElement.classList.add('image-to-add-style');
                imagesToAddContainer.appendChild(imgElement);
            });
            // Aplica o carrossel ao contêiner de imagens a serem adicionadas
            applyCarousel(imagesToAddContainer); // Chama a nova função reutilizável
        } else {
            // Se não houver imagens, oculta o contêiner
            imagesToAddContainer.style.display = 'none';
        }
    }

    // Event Listeners para a área de drop
    imageDropArea.addEventListener('click', () => {
        // Cria um input file para selecionar arquivos ao clicar
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Aceita apenas arquivos de imagem
        input.multiple = true; // Permite selecionar múltiplos arquivos

        input.onchange = (e) => {
            handleFiles(e.target.files);
        };

        input.click(); // Simula o clique no input file
    });

    imageDropArea.addEventListener('dragover', (e) => {
        e.preventDefault(); // Previne o comportamento padrão (abrir imagem em nova aba)
        imageDropArea.classList.add('dragover'); // Adiciona classe para feedback visual
    });

    imageDropArea.addEventListener('dragleave', () => {
        imageDropArea.classList.remove('dragover'); // Remove classe ao sair da área
    });

    imageDropArea.addEventListener('drop', (e) => {
        e.preventDefault(); // Previne o comportamento padrão
        imageDropArea.classList.remove('dragover'); // Remove classe

        const files = e.dataTransfer.files; // Obtém os arquivos arrastados
        handleFiles(files);
    });

    // Função para processar os arquivos selecionados/arrastados
    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    // Adiciona a Data URL da imagem ao vetor de imagens A SEREM adicionadas
                    imagesToAdd.push(e.target.result);
                    // Atualiza a exibição das imagens A SEREM adicionadas
                    displayImagesToAdd();
                };

                // Lê o arquivo como Data URL
                reader.readAsDataURL(file);
            } else {
                console.warn(`Arquivo ignorado (não é uma imagem): ${file.name}`);
            }
        }
    }

    // ========================================================================
    // FUNÇÃO REUTILIZÁVEL PARA APLICAR O COMPORTAMENTO DE CARROSSEL (ARRASTAR)
    // Aplica listeners de pointer events a um elemento para torná-lo arrastável
    // ========================================================================
    function applyCarousel(sliderElement) {
        if (!sliderElement) {
            console.error("Elemento do carrossel não fornecido.");
            return;
        }

        let isDown = false;
        let startX, scrollStart;

        // Limpa listeners anteriores para evitar duplicação se a função for chamada várias vezes no mesmo elemento
        // (Opcional, dependendo de como e quando você chama esta função)
        // No caso de carrosséis criados dinamicamente em login2.js, não será necessário limpar antes.

        sliderElement.addEventListener('pointerdown', e => {
          isDown = true;
          sliderElement.classList.add('active'); // Adiciona classe para feedback visual (definir em CSS)
          sliderElement.setPointerCapture(e.pointerId);
          startX = e.clientX;
          scrollStart = sliderElement.scrollLeft;
    	  e.preventDefault(); // evita ghost-image
        });

        sliderElement.addEventListener('pointermove', e => {
          if (!isDown) return;
          e.preventDefault();
          const walk = (e.clientX - startX) * 1.5;  // ajuste a “sensibilidade” aqui
          sliderElement.scrollLeft = scrollStart - walk;
        });

        sliderElement.addEventListener('pointerup', e => {
          isDown = false;
          sliderElement.classList.remove('active');
          sliderElement.releasePointerCapture(e.pointerId);
        });

        sliderElement.addEventListener('pointercancel', e => {
          isDown = false;
          sliderElement.classList.remove('active');
          sliderElement.releasePointerCapture(e.pointerId);
        });
         // CORRIGIDO: Usando console.log em vez de Logger.log
         console.log(`Carrossel aplicado ao elemento: ${sliderElement.id || sliderElement.className}`);
    }
    // ========================================================================
    // FIM FUNÇÃO REUTILIZÁVEL PARA CARROSSEL
    // ========================================================================


async function uploadImageToImgBB(imageData) {
    const formData = new FormData();
    formData.append('image', imageData.split(',')[1]); // Remove o prefixo Data URL
    // formData.append("album", "SEU_ID_DO_ALBUM"); // ** Substitua pelo ID do seu álbum ImgBB **
    // formData.append("key", "SUA_CHAVE_API_IMGBB"); // ** Substitua pela sua chave API ImgBB **
    // É melhor definir a chave e o ID do álbum como constantes no topo ou carregar de forma segura

    // Exemplo usando constantes (defina-as no topo do seu script ou em um arquivo de config separado)
    const IMGBB_API_KEY = '43ff22682bbe91ea89a32047a821bae8'; // ** Substitua pela sua chave API ImgBB **
  //  const IMGBB_ALBUM_ID = '2SGYcL'; // ** Substitua pelo ID do seu álbum ImgBB **

    if (!IMGBB_API_KEY) {
        console.error("Chave da API ImgBB não configurada.");
        return null;
    }
  //   if (IMGBB_ALBUM_ID) {
   //      formData.append("album", IMGBB_ALBUM_ID);
    // }


   
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data && data.data && data.data.url) {
             // CORRIGIDO: Usando console.log em vez de Logger.log
             console.log(`Imagem enviada com sucesso para: ${data.data.url}`);
             return data.data.url; // Retorna a URL da imagem
        } else {
             console.error('Erro no retorno da API ImgBB:', data);
             return null;
        }

    } catch (error) {
        console.error('Erro ao enviar imagem para ImgBB:', error);
        return null;
    }
}

    // Função para carregar imagens salvas em um contêiner específico
    // Esta função será chamada pelo login2.js para popular os contêineres de imagem na tabela
  function loadImagesIntoContainer(containerElement, imageUrls) {
    if (!containerElement) {
        console.error("Contêiner de imagens não fornecido.");
        return;
    }
    
    // Limpa o conteúdo atual do contêiner
    containerElement.innerHTML = ''; 

    if (imageUrls) {
        // Converte para array caso seja uma string separada por vírgulas
        const urls = Array.isArray(imageUrls) ? imageUrls : String(imageUrls).split(',').map(url => url.trim());
        
        urls.forEach(url => {
            if (url) { // Ignora URLs vazias
                const imgElement = document.createElement('img');
                imgElement.src = url;
                
                // === CORREÇÃO: Adiciona classes para estilização e carrossel ===
                imgElement.classList.add('scroll-image', 'carousel-image'); 
                
                // === CORREÇÃO: Define atributos para acessibilidade ===
                imgElement.alt = 'Imagem do produto';
                imgElement.loading = 'lazy'; // Otimização de carregamento
                
                containerElement.appendChild(imgElement);
            }
        });

        // === CORREÇÃO: Aplica o carrossel após 50ms (tempo para renderização) ===
        if (urls.length > 0) {
            setTimeout(() => {
                if (window.applyCarousel) {
                    window.applyCarousel(containerElement);
                } else {
                    console.error("Função applyCarousel não encontrada!");
                }
            }, 50);
        }
    } else {
        // === CORREÇÃO: Mensagem estilizada para "Sem imagens" ===
        const placeholder = document.createElement('div');
        placeholder.className = 'no-images-message';
        placeholder.textContent = 'Sem imagens cadastradas';
        containerElement.appendChild(placeholder);
    }

    // === CORREÇÃO: Garante que o container tenha a classe do carrossel ===
    containerElement.classList.add('product-images-carousel');
}
    // Ao carregar a página, aplica o carrossel ao contêiner de imagens a serem adicionadas
    // O carrossel para container_imagens (imagens salvas) será aplicado pelo login2.js
    // após carregar os dados do produto.
    window.addEventListener('load', () => {
        if(imagesToAddContainer) {
             // applyCarousel(imagesToAddContainer); // Já é chamado dentro de displayImagesToAdd
        }
        // Note: O carrossel para container_imagens (se existir no HTML inicial)
        // DEVE ser aplicado aqui se ele for populado estaticamente no HTML
        // ou se você tiver outra lógica para carregá-lo na carga inicial.
        // Se ele só é populado dinamicamente pelo login2.js, então a chamada
        // para applyCarousel deve estar no login2.js após a população.
    });


// Mantém a função uploadImageToImgBB globalmente acessível se outras partes do seu script a usarem
// window.uploadImageToImgBB = uploadImageToImgBB; // Opcional, se necessário

// Torna loadImagesIntoContainer globalmente acessível para ser chamada por login2.js
window.loadImagesIntoContainer = loadImagesIntoContainer;
window.applyCarousel = applyCarousel; // Torna a função de carrossel acessível também

