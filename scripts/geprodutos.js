  // Vetor para armazenar as imagens A SEREM adicionadas (como Data URLs)
    let imagesToAdd = [];

    // Elementos DOM
    const imageDropArea = document.getElementById('imagedrop_here');
    // Contêiner para imagens A SEREM adicionadas
    const imagesToAddContainer = document.getElementById('container_imagens_adicionar');
    // Contêiner para imagens DOS PRODUTOS SALVOS (o original)
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

    //--------------carrossel com vetor de imagens A SEREM adicionadas ---------------------
    // Script existente para o carrossel, AGORA aplicado ao NOVO contêiner imagesToAddContainer
    (function(){
        const slider = document.getElementById('container_imagens_adicionar'); // Usa o NOVO contêiner
        let isDown = false;
        let startX, scrollStart;

        slider.addEventListener('pointerdown', e => {
          isDown = true;
          slider.classList.add('active');
          slider.setPointerCapture(e.pointerId);
          startX = e.clientX;
          scrollStart = slider.scrollLeft;
    	  e.preventDefault(); // evita ghost-image
        });

        slider.addEventListener('pointermove', e => {
          if (!isDown) return;
          e.preventDefault();
          const walk = (e.clientX - startX) * 1.5;  // ajuste a “sensibilidade” aqui
          slider.scrollLeft = scrollStart - walk;
        });

        slider.addEventListener('pointerup', e => {
          isDown = false;
          slider.classList.remove('active');
          slider.releasePointerCapture(e.pointerId);
        });

        slider.addEventListener('pointercancel', e => {
          isDown = false;
          slider.classList.remove('active');
          slider.releasePointerCapture(e.pointerId);
        });
    })();
    //--------------fim carrossel com vetor de imagens A SEREM adicionadas ---------------------

async function uploadImageToImgBB(imageData) {
    const formData = new FormData();
    formData.append('image', imageData.split(',')[1]); // Remove o prefixo Data URL
    formData.append("album", "2SGYcL"); // ID do seu álbum
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=43ff22682bbe91ea89a32047a821bae8`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.data.url; // Retorna a URL da imagem
    } catch (error) {
        console.error('Erro ao enviar imagem:', error);
        return null;
    }
}

    // O carrossel para o contêiner de imagens DOS PRODUTOS SALVOS (container_imagens)
    // Se você já tem um script separado para ele ou ele é gerenciado de outra forma, mantenha-o.
    // Se o script acima era o único carrossel, você precisará duplicá-lo ou generalizá-lo
    // para funcionar com ambos os contêineres se quiser que container_imagens também seja arrastável.
    // Por enquanto, o script de carrossel foi movido APENAS para imagesToAddContainer.

    // Exemplo: Se quiser que o container_imagens original também seja arrastável,
    // você precisaria de outro bloco de código semelhante ao acima,
    // mas usando document.getElementById('container_imagens').

    // Exemplo de como carregar imagens salvas em container_imagens (requer dados do backend)
    function loadSavedProductImages(imageUrls) {
         const container = document.getElementById('container_imagens');
         container.innerHTML = ''; // Limpa o conteúdo atual

         if (imageUrls && imageUrls.length > 0) {
             imageUrls.forEach(url => {
                 const imgElement = document.createElement('img');
                 imgElement.src = url;
                 imgElement.classList.add('scroll-image'); // Reutiliza a classe de estilo
                 container.appendChild(imgElement);
             });
         } else {
             // Opcional: exibir uma mensagem ou placeholder se não houver imagens salvas
             // container.innerHTML = '<p>Sem imagens salvas para este produto.</p>';
         }
     }

    // Ao carregar a página ou selecionar um produto existente:
    // Chame loadSavedProductImages com as URLs das imagens do produto.
    // Ex: loadSavedProductImages(['image/adorable_cute_kawaii_painful_f(1).jpeg', 'image/adorable_cute_kawaii_painful_f(2).jpeg']);

