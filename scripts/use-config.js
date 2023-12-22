import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configName = process.argv[2];
fs.copyFileSync(join(__dirname, '../config', `.env.global`), join(__dirname, '..', '.env'));
fs.appendFileSync(join(__dirname, '..', '.env'), fs.readFileSync(join(__dirname, '../config', `.env.${configName}`)));

const commitSha = execSync('git rev-parse HEAD').toString().trim();
fs.appendFileSync(join(__dirname, '..', '.env'), `PUBLIC_COMMIT_SHA=${commitSha}\n`);
