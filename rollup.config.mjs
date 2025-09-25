import { glob } from 'glob';
import typescript from '@rollup/plugin-typescript';

const files = await glob('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.stories.ts']
});

export default {
  input: files,

  output: {
    dir: 'dist',
    format: 'es',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js',
    assetFileNames: '[name][extname]'
  },

  external: [
    'axios',
    'spark-md5',
    'tslib'
  ],

  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    })
  ],

  treeshake: true
};

