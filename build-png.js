const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sharp = require('sharp');

const ROOT = __dirname;
const imgPath = path.join(ROOT, 'cover.jpg');
const cardPath = path.join(ROOT, 'dist', 'character-card.json');
const outputPath = path.join(ROOT, 'dist', 'character-card.png');

const cardJson = fs.readFileSync(cardPath, 'utf8');
const cardBase64 = Buffer.from(cardJson, 'utf8').toString('base64');

sharp(imgPath)
  .resize(461, 461, { fit: 'cover' })
  .png()
  .toBuffer()
  .then(pngBuf => {
    // Find IEND chunk signature
    const iendSig = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    const iendIdx = pngBuf.indexOf(iendSig);
    if (iendIdx === -1) throw new Error('IEND not found');

    // Build tEXt chunk with keyword "chara" (SillyTavern compatible)
    // Format: keyword\0value  (null-separated)
    const keyword = Buffer.from('chara', 'ascii');
    const nullSep = Buffer.from([0x00]);
    const textData = Buffer.concat([keyword, nullSep, Buffer.from(cardBase64, 'ascii')]);
    const chunkType = Buffer.from('tEXt', 'ascii');

    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(textData.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([chunkType, textData])), 0);

    const textChunk = Buffer.concat([lenBuf, chunkType, textData, crcBuf]);

    // Insert tEXt chunk before IEND
    const result = Buffer.concat([
      pngBuf.slice(0, iendIdx),
      textChunk,
      pngBuf.slice(iendIdx)
    ]);

    fs.writeFileSync(outputPath, result);
    const st = fs.statSync(outputPath);
    console.log('character-card.png: ' + (st.size / 1024).toFixed(0) + ' KB');
    console.log('card data: ' + cardJson.length + ' chars, base64: ' + cardBase64.length + ' chars');
    console.log('tEXt chunk data: ' + textData.length + ' bytes');
  })
  .catch(e => { console.error(e); process.exit(1); });

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
