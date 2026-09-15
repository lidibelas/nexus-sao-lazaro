
const { createCanvas, loadImage } = require("canvas");

async function testDerivative() {
    console.log("TESTE 5: Geracao de derivado via Canvas");
    console.log("=" .repeat(60));
    
    // 1. Criar imagem original simulada (1600x1200 JPEG)
    const origCanvas = createCanvas(1600, 1200);
    const origCtx = origCanvas.getContext("2d");
    origCtx.fillStyle = "#3a7ca5";
    origCtx.fillRect(0, 0, 1600, 1200);
    origCtx.fillStyle = "#ffffff";
    origCtx.font = "bold 48px sans-serif";
    origCtx.fillText("NEXUS - Foto Original", 100, 100);
    origCtx.fillText("1600 x 1200 px", 100, 160);
    
    const origBuf = origCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    console.log("Original: " + origBuf.length + " bytes (" + (origBuf.length/1024).toFixed(0) + " KB), 1600x1200");
    
    // 2. Redimensionar para 800px (logica do upload.js)
    const img = await loadImage(origBuf);
    let width = img.width;
    let height = img.height;
    const MAX_W = 800;
    const QUALITY = 0.80;
    
    if (width > MAX_W) {
        height = Math.round(height * (MAX_W / width));
        width = MAX_W;
    }
    
    console.log("Derivado: " + width + "x" + height + "px");
    console.log("Proporcao: " + (width/height).toFixed(3) + " (original: " + (1600/1200).toFixed(3) + ")");
    
    // 3. Gerar derivado JPEG
    const dCanvas = createCanvas(width, height);
    const dCtx = dCanvas.getContext("2d");
    dCtx.drawImage(img, 0, 0, width, height);
    const derivBuf = dCanvas.toBuffer("image/jpeg", { quality: QUALITY });
    
    console.log("Tamanho: " + derivBuf.length + " bytes (" + (derivBuf.length/1024).toFixed(0) + " KB)");
    console.log("Compressao: " + ((1 - derivBuf.length/origBuf.length) * 100).toFixed(0) + "% menor");
    
    // 4. JPEG valido?
    const isJPEG = derivBuf[0] === 0xFF && derivBuf[1] === 0xD8;
    console.log("JPEG valido: " + isJPEG);
    
    // 5. Regeneracao
    console.log("\n--- Regeneracao ---");
    const regenImg = await loadImage(origBuf);
    const regenCanvas = createCanvas(MAX_W, Math.round(1200*(MAX_W/1600)));
    const regenCtx = regenCanvas.getContext("2d");
    regenCtx.drawImage(regenImg, 0, 0, MAX_W, Math.round(1200*(MAX_W/1600)));
    const regenBuf = regenCanvas.toBuffer("image/jpeg", { quality: QUALITY });
    console.log("Regenerado: " + regenBuf.length + " bytes (" + (regenBuf.length/1024).toFixed(0) + " KB)");
    console.log("Igual ao original: " + (regenBuf.length === derivBuf.length));
    
    // 6. Imagem pequena (nao redimensiona)
    console.log("\n--- Imagem menor que 800px ---");
    const smallCanvas = createCanvas(400, 300);
    const smallCtx = smallCanvas.getContext("2d");
    smallCtx.fillStyle = "#ff6b6b";
    smallCtx.fillRect(0, 0, 400, 300);
    const smallBuf = smallCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    const smallImg = await loadImage(smallBuf);
    let sw = smallImg.width, sh = smallImg.height;
    if (sw > MAX_W) { sh = Math.round(sh*(MAX_W/sw)); sw = MAX_W; }
    console.log("400x300 -> " + sw + "x" + sh + " (nao redimensionado)");
    
    // 7. Imagem muito larga (panoramica 3000x1000)
    console.log("\n--- Panoramica 3000x1000 ---");
    const wideCanvas = createCanvas(3000, 1000);
    const wideCtx = wideCanvas.getContext("2d");
    wideCtx.fillStyle = "#2ecc71";
    wideCtx.fillRect(0, 0, 3000, 1000);
    const wideBuf = wideCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    const wideImg = await loadImage(wideBuf);
    let ww = wideImg.width, wh = wideImg.height;
    if (ww > MAX_W) { wh = Math.round(wh*(MAX_W/ww)); ww = MAX_W; }
    console.log("3000x1000 -> " + ww + "x" + wh + " (proporcao: " + (ww/wh).toFixed(3) + ")");
    
    const allGood = isJPEG && width === 800 && regenBuf.length === derivBuf.length && sw === 400 && ww === 800;
    console.log("\nResultado: " + (allGood ? "TODOS PASSARAM" : "FALHAS DETECTADAS"));
}

testDerivative().catch(e => console.error("ERRO:", e));
