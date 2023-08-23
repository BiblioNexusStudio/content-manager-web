import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configName = process.argv[2];
fs.copyFileSync(join(__dirname, '../config', `.env.${configName}`), join(__dirname, '..', '.env'));
fs.appendFile(join(__dirname, '..', '.env'), fs.readFileSync(join(__dirname, '../config', `.env.global`)), {}, () => {
    // no-op
});
