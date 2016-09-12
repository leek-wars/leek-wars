var Class = function() {
    this.initialize && this.initialize.apply(this, arguments)
}

Class.extend = function(base, childPrototype) {
    var parent = this
    var child = function() { 
        parent.apply(this, arguments)
        if (this.__construct) this.__construct(arguments)
    }
    child.extend = parent.extend
    var Surrogate = function() {}
    Surrogate.prototype = parent.prototype
    child.prototype = new Surrogate
    for (var key in base) child[key] = base[key]
    var instance = new childPrototype
    for (var key in instance) child.prototype[key] = instance[key]
    return child
}