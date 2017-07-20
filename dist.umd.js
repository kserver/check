(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.unknown = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ERROR_REQUIRE = 1;
    var ERROR_TYPE = 2;
    var ERROR_ARRAY_RANGE = 3;
    var ERROR_FUNCTION_VALID = 4;
    var ERROR_NULL = 5;

    function getValueType(value) {
        if (value instanceof Date) return 'date';
        if (value instanceof RegExp) return 'regexp';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    function isEmptyValue(value) {
        if (value === undefined || value === null) return true;
        if (value !== value /*NaN*/) return true;
        if (value.trim && value.trim() === '') return true;

        return false;
    }

    function prefixKey(prefix, key) {
        if (key) return prefix + '.' + key;
        return '' + prefix;
    }

    function transFunctionalCheck(checkResult, row) {
        if (typeof checkResult === 'boolean' || checkResult == null) {
            if (checkResult) return { valid: true, data: row };else return { valid: false, error: { '': ERROR_FUNCTION_VALID } };
        }
        if (typeof checkResult === 'object') {
            if (checkResult.valid && checkResult.data) return checkResult;
            if (!checkResult.valid && checkResult.error) return checkResult;
        }

        return { valid: true, data: checkResult };
    }

    function check(template, data) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        if (data === null) return { valid: false, error: { '': ERROR_NULL } };

        var _options$requirePrefi = options.requirePrefix,
            requirePrefix = _options$requirePrefi === undefined ? '*' : _options$requirePrefi,
            _options$filter = options.filter,
            filter = _options$filter === undefined ? false : _options$filter,
            _options$strict = options.strict,
            strict = _options$strict === undefined ? false : _options$strict;


        var templateType = getValueType(template);
        var dataType = getValueType(data);

        if (!strict) {
            if (templateType === 'string' && dataType === 'number') return { valid: true, data: String(data) };
            if (templateType === 'number' && dataType === 'string') {
                var transResult = Number(data);
                if (isNaN(transResult)) {
                    return { valid: false, error: { '': ERROR_TYPE } };
                } else return { valid: true, data: transResult };
            }
        }
        if (templateType === 'function' && template.length > 0 /* fn arguments */) {
                return transFunctionalCheck(template(data, options), data);
            }

        if (templateType !== dataType) {
            return {
                valid: false,
                error: { '': ERROR_TYPE }
            };
        }

        if (['number', 'boolean', 'string', 'date', 'regexp', 'undefined', 'function'].includes(templateType)) return { valid: true, data: data };

        if (templateType === 'array') {
            var _ret = function () {
                var l = [];
                var error = {};
                var hasError = false;

                var t = template[0];
                var arrayOptions = template[1] || {};

                if (arrayOptions.min && data.length < arrayOptions.min || arrayOptions.max && data.length > arrayOptions.max) {
                    return {
                        v: { valid: false, error: { '': ERROR_ARRAY_RANGE } }
                    };
                }

                if (!t) return {
                        v: { valid: true, data: data }
                    };

                var _loop = function (i) {
                    var checkResult = check(t, data[i], options);
                    if (checkResult.valid) {
                        l.push(checkResult.data);
                        return 'continue';
                    }

                    hasError = true;

                    Object.keys(checkResult.error).forEach(function (key) {
                        error[prefixKey(i, key)] = checkResult.error[key];
                    });
                };

                for (var i = 0; i < data.length; ++i) {
                    var _ret2 = _loop(i);

                    if (_ret2 === 'continue') continue;
                }

                if (hasError) return {
                        v: { valid: false, error: error }
                    };

                return {
                    v: { valid: true, data: l }
                };
            }();

            if (typeof _ret === "object") return _ret.v;
        }

        data = Object.assign({}, data);
        var d = {};
        var e = {};
        var hasError = false;

        Object.keys(template).forEach(function (field) {
            var templateValue = template[field];
            var isRequire = field.startsWith(requirePrefix);
            if (isRequire) {
                field = field.substr(requirePrefix.length);
            }
            var dataValue = data[field];
            delete data[field];

            if (isRequire && isEmptyValue(dataValue)) {
                hasError = true;
                e[field] = ERROR_REQUIRE;
            }
            if (dataValue === undefined) return;
            if (templateValue === null || dataValue === null) {
                d[field] = dataValue;
                return;
            }

            var r = check(templateValue, dataValue, options);
            if (r.valid) {
                d[field] = r.data;
            } else {
                hasError = true;
                Object.keys(r.error).forEach(function (key) {
                    e[prefixKey(field, key)] = r.error[key];
                });
            }
        });

        if (hasError) return { valid: false, error: e };

        if (!filter) Object.assign(d, data);
        return { valid: true, data: d };
    }

    exports.default = check;
});