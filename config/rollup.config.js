import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import visualizer from 'rollup-plugin-visualizer';

const ENV = process.env.NODE_ENV;

const config = {
  input: 'src/index.ts',
  plugins: [sizeSnapshot(), visualizer()]
};

if (ENV === 'es' || ENV === 'cjs') {
  config.output = { format: ENV };
  config.plugins.push(typescript({ objectHashIgnoreUnknownHack: true }));
}

if (ENV === 'development' || ENV === 'production') {
  config.output = { format: 'umd', name: 'createReducer' };
  config.plugins.push(
    nodeResolve({
      mainFields: ['jsnext:main', 'main']
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      objectHashIgnoreUnknownHack: true
    }),
    commonjs({ extensions: ['.js', '.ts'] }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(ENV)
    })
  );
}

if (ENV === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true
      },
      warnings: false
    })
  );
}

export default config;
