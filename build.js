
const fs = require('fs');
const babel = require('babel-core');
const UglifyJs = require('uglify-js');

const src = fs.readFileSync('./index.js', {encoding:'utf8'})
                .replace(/module\.exports\s*=\s*check/, 'export default check');
const transformResult = babel.transform(src, {
    "plugins": [
        "transform-es2015-block-scoping",
        "transform-es2015-template-literals",
        "transform-es2015-parameters",
        "transform-es2015-destructuring",
        "transform-es2015-modules-umd",
        "transform-es2015-shorthand-properties"
    ]
});

fs.writeFileSync('./dist.umd.js', transformResult.code);

const minifyResult = UglifyJs.minify(transformResult.code);
fs.writeFileSync('./dist.umd.min.js', minifyResult.code);
