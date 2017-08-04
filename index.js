const ERROR_REQUIRE = 1;
const ERROR_TYPE = 2;
const ERROR_ARRAY_RANGE = 3;
const ERROR_FUNCTION_VALID = 4;
const ERROR_NULL = 5;

function getValueType(value){
    if(value instanceof Date) return 'date';
    if(value instanceof RegExp) return 'regexp';
    if(Array.isArray(value)) return 'array';
    return typeof value;
}

function isEmptyValue(value){
    if(value===undefined||value===null) return true;
    if(value!==value/*NaN*/) return true;
    if(value.trim&&value.trim()==='') return true;

    return false;
}

function prefixKey(prefix, key){
    if(key) return `${prefix}.${key}`;
    return `${prefix}`;
}

function transFunctionalCheck(checkResult, row){
    if((typeof checkResult === 'boolean')||checkResult==null){
        if(checkResult) return { valid: true, data: row };
        else return { valid: false, error: {'': ERROR_FUNCTION_VALID} };
    }
    if(typeof checkResult === 'object'){
        if(checkResult.valid&&checkResult.data) return checkResult;
        if(!checkResult.valid&&checkResult.error) return checkResult;
    }


    return { valid: true, data: checkResult };
}

function check(template, data, options = {}, /*internal*/arrayIndex){
    if(data===null) return { valid: false, error: { '': ERROR_NULL  } };
    if(template===null) return { valid: true, data };

    const { requirePrefix = '*', filter = false, strict = false } = options;

    const templateType = getValueType(template);
    const dataType = getValueType(data);

    if(!strict){
        if(templateType==='string'&&dataType==='number') return { valid: true, data: String(data) };
        if(templateType==='number'&&dataType==='string'){
            const transResult = Number(data);
            if(isNaN(transResult)){
                return { valid: false, error: { '': ERROR_TYPE } };
            }
            else return { valid: true, data: transResult };
        }
    }
    if(templateType==='function'&&template.length>0/* fn arguments */){
        return transFunctionalCheck(template(data, options, arrayIndex), data);
    }

    if(templateType!==dataType){
        return {
            valid: false,
            error: { '': ERROR_TYPE }
        }
    }

    if(['number', 'boolean', 'string', 'date', 'regexp', 'undefined', 'function'].includes(templateType)) 
        return { valid: true, data: data };

    if(templateType==='array'){
        const l = [];
        const error = {};
        let hasError = false;

        let ts = [];
        let options = {};

        if(template.length>=2){
            options = template[template.length-1];
            ts.push.apply(ts, template.slice(0, template.length-1));
        }else{
            ts = template;
        }
        
        if(
            (options.min && data.length<options.min)||
            (options.max && data.length>options.max)
        ){
            return { valid: false, error: { '': ERROR_ARRAY_RANGE } }
        }

        if(ts.length===0) return { valid: true, data };

        for(let i=0; i<data.length; ++i){
            const t = i<ts.length ? ts[i] : ts[ts.length-1];
            if(t===null){
                l.push(data[i]);
                continue;
            }

            const checkResult = check( t, data[i], options, i );
            if(checkResult.valid){
                l.push(checkResult.data);
                continue;
            }

            hasError = true;

            Object.keys(checkResult.error).forEach(function(key){
                error[prefixKey(i, key)] = checkResult.error[key];
            })
        }

        if(hasError) return { valid: false, error };

        return { valid: true, data: l };
    }

    data = Object.assign({}, data);
    const d = {};
    const e = {};
    let hasError = false;

    Object.keys(template).forEach(function(field){
        const templateValue = template[field];
        const isRequire = field.startsWith(requirePrefix);
        if(isRequire){
            field = field.substr(requirePrefix.length);
        }
        const dataValue = data[field];
        delete data[field];

        if(isRequire && isEmptyValue(dataValue)){
            hasError = true;
            e[field] = ERROR_REQUIRE;
        }
        if(dataValue===undefined) return;
        if(templateValue===null||dataValue===null) {
            d[field] = dataValue;
            return;
        }

        const r = check(templateValue, dataValue, options);
        if(r.valid){
            d[field] = r.data;
        }else{
            hasError = true;
            Object.keys(r.error).forEach(function(key){
                e[prefixKey(field, key)] = r.error[key];
            })
        }
    })

    if(hasError) return { valid: false, error: e };

    if(!filter) Object.assign(d, data);
    return { valid: true, data: d };
}


module.exports = check;