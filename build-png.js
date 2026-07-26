const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const extract = require('png-chunks-extract');
const PNGtext = require('png-chunk-text');

const ROOT = __dirname;
const imgPath = path.join(ROOT, 'cover.jpg');
const cardPath = path.join(ROOT, 'dist', 'character-card.json');
const outputPath = path.join(ROOT, 'dist', 'character-card.png');

const cardJson = fs.readFileSync(cardPath, 'utf8');

sharp(imgPath)
  .resize(461, 461, { fit: 'cover' })
  .png()
  .toBuffer()
  .then(pngBuf => {
    // 1. Extract all PNG chunks
    const chunks = extract(new Uint8Array(pngBuf));

    // 2. Remove existing chara/ccv3 tEXt chunks (same as SillyTavern does)
    const tEXtChunks = chunks.filter(chunk => chunk.name === 'tEXt');
    for (const tEXtChunk of tEXtChunks) {
      const data = PNGtext.decode(tEXtChunk.data);
      if (data.keyword.toLowerCase() === 'chara' || data.keyword.toLowerCase() === 'ccv3') {
        chunks.splice(chunks.indexOf(tEXtChunk), 1);
      }
    }

    // 3. Add V2 chunk (chara) - exactly as SillyTavern does
    const base64Data = Buffer.from(cardJson, 'utf8').toString('base64');
    chunks.splice(-1, 0, PNGtext.encode('chara', base64Data));

    // 4. Add V3 chunk (ccv3) for compatibility
    try {
      const v3Data = JSON.parse(cardJson);
      v3Data.spec = 'chara_card_v3';
      v3Data.spec_version = '3.0';
      const v3Base64 = Buffer.from(JSON.stringify(v3Data), 'utf8').toString('base64');
      chunks.splice(-1, 0, PNGtext.encode('ccv3', v3Base64));
    } catch (e) {
      // V3 chunk is optional
    }

    // 5. Re-encode chunks to PNG buffer
    const result = encodeChunks(chunks);

    fs.writeFileSync(outputPath, result);
    const st = fs.statSync(outputPath);
    console.log('character-card.png: ' + (st.size / 1024).toFixed(0) + ' KB');
    console.log('card data: ' + cardJson.length + ' chars, base64: ' + base64Data.length + ' chars');
  })
  .catch(e => { console.error(e); process.exit(1); });

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function encodeChunks(chunks) {
  const parts = [PNG_SIGNATURE];
  for (const chunk of chunks) {
    const type = Buffer.from(chunk.name, 'ascii');
    const data = Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
    parts.push(len, type, data, crc);
  }
  return Buffer.concat(parts);
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
