import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import { eslint } from "rollup-plugin-eslint";

export default {
    input: 'lib/PasteFromWord.js',
    output: {
        file: 'dist/index.js',
        name: "PasteFromWord",
        format: 'umd'
    },
    plugins: [
        eslint({
            fix: true,
            exclude: 'node_modules/**'
        }),
        babel({
          exclude: 'node_modules/**'
        }),
        uglify()
    ]
}
