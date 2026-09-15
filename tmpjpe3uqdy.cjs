
const { createCanvas, loadImage } = require("canvas");

async function testDerivative() {
    console.log("TESTE 5: Geracao de derivado via Canvas");
    console.log("============================================================");
    
    // 1. Original 1600x1200
    const origCanvas = createCanvas(1600, 1200);
    const origCtx = origCanvas.getContext("2d");
    origCtx.fillStyle = "#3a7ca5";
    origCtx.fillRect(0, 0, 1600, 1200);
    origCtx.fillStyle = "#ffffff";
    origCtx.font = "bold 48px sans-serif";
    origCtx.fillText("NEXUS Original 1600x1200", 100, 100);
    const origBuf = origCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    console.log("Original: " + origBuf.length + " bytes (" + (origBuf.length/1024).toFixed(0) + " KB), 1600x1200");
    
    // 2. Redimensionar para 800px
    const img = await loadImage(origBuf);
    let width = img.width, height = img.height;
    const MAX_W = 800, QUALITY = 0.80;
    if (width > MAX_W) { height = Math.round(height*(MAX_W/width)); width = MAX_W; }
    console.log("Derivado: " + width + "x" + height + "px");
    console.log("Proporcao: " + (width/height).toFixed(3) + " (original: " + (1600/1200).toFixed(3) + ")");
    
    // 3. Gerar JPEG 80%
    const dCanvas = createCanvas(width, height);
    dCanvas.getContext("2d").drawImage(img, 0, 0, width, height);
    const derivBuf = dCanvas.toBuffer("image/jpeg", { quality: QUALITY });
    console.log("Tamanho: " + derivBuf.length + " bytes (" + (derivBuf.length/1024).toFixed(0) + " KB)");
    console.log("Compressao: " + ((1-derivBuf.length/origBuf.length)*100).toFixed(0) + "% menor");
    console.log("JPEG valido (FF D8): " + (derivBuf[0] === 0xFF && derivBuf[1] === 0xD8));
    
    // 4. Regeneracao
    console.log("\n--- Regeneracao ---");
    const regenImg = await loadImage(origBuf);
    const rCanvas = createCanvas(MAX_W, Math.round(1200*(MAX_W/1600)));
    rCanvas.getContext("2d").drawImage(regenImg, 0, 0, MAX_W, Math.round(1200*(MAX_W/1600)));
    const regenBuf = rCanvas.toBuffer("image/jpeg", { quality: QUALITY });
    console.log("Regenerado: " + regenBuf.length + " bytes (" + (regenBuf.length/1024).toFixed(0) + " KB)");
    console.log("Igual ao primeiro: " + (regenBuf.length === derivBuf.length));
    
    // 5. Imagem pequena (400x300)
    console.log("\n--- Imagem 400x300 ---");
    const smCanvas = createCanvas(400, 300);
    const smCtx = smCanvas.getContext("2d");
    smCtx.fillStyle = "#ff6b6b";
    smCtx.fillRect(0, 0, 400, 300);
    const smBuf = smCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    const smImg = await loadImage(smBuf);
    let sw = smImg.width, sh = smImg.height;
    if (sw > MAX_W) { sh = Math.round(sh*(MAX_W/sw)); sw = MAX_W; }
    console.log("400x300 -> " + sw + "x" + sh + " (nao redim: " + (sw === 400) + ")");
    
    // 6. Panoramica 3000x1000
    console.log("\n--- Panoramica 3000x1000 ---");
    const wideCanvas = createCanvas(3000, 1000);
    wideCanvas.getContext("2d").fillStyle = "#2ecc71";
    wideCanvas.getContext("2d").fillRect(0, 0, 3000, 1000);
    const wideBuf = wideCanvas.toBuffer("image/jpeg", { quality: 0.9 });
    const wideImg = await loadImage(wideBuf);
    let ww = wideImg.width, wh = wideImg.height;
    if (ww > MAX_W) { wh = Math.round(wh*(MAX_W/ww)); ww = MAX_W; }
    console.log("3000x1000 -> " + ww + "x" + wh + " (proporcao: " + (ww/wh).toFixed(3) + ", orig: " + (3000/1000).toFixed(3) + ")");
    
    const allPass = (derivBuf[0] === 0xFF && width === 800 && regenBuf.length === derivBuf.length && sw === 400 && ww === 800);
    console.log("\nResultado: " + (allPass ? "TODOS PASSARAM" : "FALHAS"));
}

testDerivative().catch(e => console.error("ERRO:", e));
