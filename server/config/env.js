import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = dirname(fileURLToPath(import.meta.url));
// Resolve the shared project-root .env regardless of whether the API is launched
// from the repository root or with npm's workspace-specific working directory.
dotenv.config({ path: resolve(configDirectory, '../../.env') });
