import { defineConfig } from 'drizzle-kit';

const schema = __dirname + '/schema.ts';

export default defineConfig({ dialect: 'sqlite', schema });
