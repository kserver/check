# kserver-check

a powerful data validator use a set of simple template rule syntax

## Installation

* npm
```
npm install kserver-check --save-dev
```
* or use yarn
```
yarn add kserver-check --dev
```

## Usage:

```js
check(templateRule, data, options?) : CheckResult
```

## Rules

#### Object

* `key` start with '*' indicate this prop is required

* `value` type indicate this prop value type

* `value` equal `null` means this prop value can be any type

*Note*: if `value` is function with parameters, it's a custom validator, and the function receive data value and options arguments and return boolean or CheckResult
```js
// example
const templateRule = {
    '*name': 'name'
    'address': 'here address',
    'number': 10,
    'external': null,
    
    'hotel': { '*name': 'hotel name' },

    'callback'(){}
    'days'(days, options){ return days<10&&days>=3 },

    'list': [{}]
}
/* 
this Rule means data 
    require 'name' prop
    'name'/'address' expect String value
    'number' expect Number value (if strict set true, see Options)
    'external' can be all Types
    if exists 'hotel', 'hotel.name' is required
    'callback' expect a function
    'days' validate by custom function
*/
```

#### Array

* `first item`: item rules
* `second item`: options

```js
const templateRule = [
    { '*name': 'name' },
    { min: 3, max: 10 }
]

/*
this Rule means data
    is Array
    Array item require 'name' prop
    Array need at least 3 item and at most 10 item;
*/
```

#### CheckResult

* `valid`: indicate data is valid
* `data`: if `valid` is true, `data` give you a filtered and converted result data (see Options)
* `error`: if `valid` is false, `error` show you which prop/field check valid and error type

```js
// example
{ valid: false, error: { 'name': 1, 'list.0.name': 2 } }
```

## Options

|field|description|default|
|:---:|:---|:---:|
|requirePrefix|required field prefix|'*'|
|filter|if set true, the data in CheckResult will filter all non-defined props in template Rule|false|
|strict|if set false, the validator will try convert String to Number(or Number to String) before compare value type, and output the converted value in CheckResult |false

## Error Code

|code|description|
|:---:|:---|
|1|required field
|2|incorrect type
|3|array out of range
|4|custom check valid
|5|null value

## Example:

```js
// or use es6
// import check from 'kserver-check';
const check = require('kserver-check');

check({'*name':'name'}, {}) // result: {valid:false, error:{ 'name':1 } }
check([{'*name':'name'}], [{name:'wang'}, {}]) // result: {valid:false, error:{'1.name':1}}

```



## License

MIT

