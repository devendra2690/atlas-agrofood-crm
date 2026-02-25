const fs = require('fs');
const path = require('path');

const imgPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
try {
  const bitmap = fs.readFileSync(imgPath);
  const base64Str = Buffer.from(bitmap).toString('base64');
  const tsContent = `export const atlasLogoBase64 = "data:image/png;base64,${base64Str}";\n`;
  
  fs.writeFileSync(path.join(process.cwd(), 'src', 'lib', 'logo-base64.ts'), tsContent);
  console.log('Successfully generated src/lib/logo-base64.ts');
} catch (e) {
  console.error('Failed to read logo.png:', e.message);
}
