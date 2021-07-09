import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'
import { eslint } from 'rollup-plugin-eslint'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
    input: 'lib/PasteFromWord.js',
    output: {
        file: 'dist/index.js',
        name: 'PasteFromWord',
        format: 'umd',
    },
    plugins: [
        eslint({
            fix: true,
            exclude: 'node_modules/**',
        }),
        babel({
            exclude: 'node_modules/**',
            runtimeHelpers: true, // 使plugin-transform-runtime生效
            externalHelpers: true,
        }),
        nodeResolve({
            browser: true,
        }),
        commonjs(),
        uglify(),
    ],
}
