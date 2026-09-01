# Plano: Zip dos arquivos de asset do projeto RHYTMO

## Objetivo
Baixar todos os arquivos de asset (fonts, logo, sons, imagens) que estão armazenados como pointers CDN no projeto, organizá-los em pastas e entregá-los como um único arquivo `.zip` na pasta de arquivos do chat.

## Origem dos arquivos
Os arquivos binários reais não estão no repositório — cada um é um `*.asset.json` em `src/assets/` que aponta para uma URL CDN (`/__l5e/assets-v1/...`). O binário precisa ser baixado do servidor de dev (`http://localhost:8080`) usando a URL do pointer.

## Etapas
1. Para cada `*.asset.json` em `src/assets/`, extrair `url` e `original_filename`.
2. Baixar o binário da URL (servidor local) preservando o nome original.
3. Organizar em subpastas por tipo:
   - `Fonts/` → Coolvetica_Rg.otf, Giga.otf, GoodLookingFont.otf, HSJandari-Regular.ttf, Medium.otf, NotoSans-SemiBold.ttf, vipnagorgialla.regular.otf
   - `Logo/` → RhytmoPrincipal_Logo.svg
   - `Sounds/` → arcade-click.mp3, beep-ploc.mp3, confirm-tap.mp3, modal-close.mp3, popup-close.mp3, popup-open.mp3, wind-swoosh.mp3
   - `Images/` → bg-still.jpg, bubbles_10.png, hero.gif, hero.mp4, hero.webm, hero-poster.webp, liam_10.jpg, paradela-01-b.png, paradela-02-c.png, paradela-03-b.png, paradela-04-b.png, perfect_hue_1.jpg, shop-bg.gif, windows_xp_31.jpg
   - `Product/` → product-cargo.jpg, product-hoodie.jpg, product-shell.jpg, product-tee.jpg (estes já são arquivos reais no repo, copiados diretamente)
4. Compactar a pasta em `rhytmo-assets.zip`.
5. Mover/copiar o zip para `/mnt/documents/rhytmo-assets.zip` para entrega no chat.
6. Verificar o conteúdo do zip (`unzip -l`) e reportar.

## Entrega
- Arquivo: `/mnt/documents/rhytmo-assets.zip`
- Estrutura interna em subpastas por tipo de asset.

## Notas
- Nenhuma alteração no código ou layout do site — somente leitura de assets e geração do zip.
- Os arquivos `*.asset.json` (pointers) não entram no zip; apenas os binários reais.
