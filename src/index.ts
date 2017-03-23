import * as Mustache from 'mustache'
var x = Mustache.render("{{a}}", {a:'test'});
console.log(x);