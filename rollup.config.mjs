// rollup.config.mjs
import { glob } from 'glob';
import typescript from '@rollup/plugin-typescript';

const files = await glob('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.stories.ts']
});

export default {
  // 2) 直接用文件列表作为 input（配合 preserveModules）
  input: files,

  output: {
    dir: 'dist',
    format: 'es',
    // 关键：保持模块结构与 src 一致
    preserveModules: true,
    preserveModulesRoot: 'src',
    // 每个模块各自输出一个 js 文件
    entryFileNames: '[name].js',
    // 如果会有静态资源/worker 等，也保持原名
    assetFileNames: '[name][extname]'
  },

  // 3) 这些依赖让应用侧去打包（网络请求库一般不内联）
  external: [
    'axios',
    'spark-md5',
    'tslib' // 若 tsconfig 开了 importHelpers，建议外置
  ],

  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      // 让 rollup 仅负责 js，类型用 tsc 单独产（避免 TS5069 类冲突）
      declaration: false,
      declarationMap: false
    })
  ],

  treeshake: true
};
