
(function (doc) {

	var nano = function (arg, context) {
		if (nano.isNano(context)) {
			return context.find(arg);
		} else {
			return new Nano(arg, context || doc);
		}
	};
	nano.extend = function (elem, safe, from) {
		if (arguments.length == 2) {
			from = safe;
			safe = false;
		} else if (arguments.length == 1) {
			from = elem;
			elem = nano;
		}
		for (var i in from) {
			if (safe && i in elem) continue;
			elem[i] = from[i];
		}
		return elem;
	};
	nano.extend(nano, {
		implement : function (elem, safe, from) {
			return nano.extend(elem.prototype, safe, from);
		},
		find : function (In, selector) {
			if (!selector) return [In];

			var toArray = nano.toArray;
			if (typeof selector == 'string') {
				return toArray(In.querySelectorAll(selector));
			} else if (selector.nodeName) {
				return [selector];
			} else if (selector.id) {
				return [In.getElementById(selector.id)];
			} else if (selector.tag) {
				return toArray(In.getElementsByTagName(selector.tag));
			} else if (selector.Class) {
				return toArray(In.getElementsByClassName(selector.Class));
			} else {
				return [In];
			}
		},
		toArray : function (elem) {
			return Array.prototype.slice.call(elem);
		},
		unique: function (array) {
			var tmp = [];
			for (var i = 0; i < array.length; i++) if (i in array) {
				if (!nano.contains(tmp, array[i])) {
					tmp.push(array[i]);
				}
			}
			return tmp;
		},
		setter : function (args) {
			if (args.length == 2) {
				var r = {};
				r[args[0]] = args[1];
				return r;
			} else {
				return args;
			}
		},
		contains : function (array, elem) {
			for (var i = array.length; i--;) if (i in array) {
				 if (elem === array[i]) return true;
			}
			return false;
		},
		log : function () {
			var c = window.console;
			if (c && c.log) {
				return c.log.apply(c, arguments);
			} else return false;
		},
		isNano : function (elem) {
			return elem && elem instanceof Nano;
		}
	});

	var Nano = function (arg, In) {
		if (!arguments.length) {
			this.elems = [doc];
		} else if (nano.isNano(arg)) {
			this.elems = arg.elems;
		} else if (typeof arg == 'function') {
			this.elems = [In];
			this.ready(arg);
		} else if (arg instanceof Array) {
			this.elems = arg;
		} else if (arg instanceof HTMLCollection) {
			this.elems = nano.toArray(arg);
		} else {
			this.elems = nano.find(In, arg);
		}
		return this;
	};

	nano.implement(Nano, {
		get : function (index) {
			return this.elems[index || 0];
		},
		create : function (tagName, index) {
			return nano(this.get(index).createElement(tagName));
		},
		each : function (fn) {
			this.elems.forEach(fn.bind(this));
			return this;
		},
		css : function (css) {
			var css = nano.setter(arguments);
			return this.each(function (elem) {
				nano.extend(elem, css);
			});
		},
		bind : function () {
			var events = nano.setter(arguments);
			return this.each(function (elem) {
				for (var i in events) {
					elem.addEventListener(i, events[i].bind(this, this), false);
				}
			}.bind(this));
		},
		ready : function (full, fn) {
			if (arguments.length == 1) {
				fn   = full;
				full = false;
			};
			return this.bind(full ? 'load' : 'DOMContentLoaded', fn);
		},
		find : function (selector) {
			var result = [];
			this.each(function (elem) {
				result = result.concat(nano.find(elem, selector));
			});
			return nano(nano.unique(result));
		},
		log : function () {
			nano.log.call(nano, arguments.length ? arguments : ['nano', this.elems]);
			return this;
		},
		appendTo : function (to) {
			to = nano(to).get();
			return this.each(function (elem) {
				to.appendChild(elem);
			});
		}
	});
	
	window.nano = nano;
})(document);

(function () {
	// JavaScript 1.8.5 Compatiblity

	nano.implement(Function, 'safe', {
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		bind : function(context /*, arg1, arg2... */) {
			'use strict';
			if (typeof this !== 'function') throw new TypeError();
			var _slice = Array.prototype.slice,
				_concat = Array.prototype.concat,
				_arguments = _slice.call(arguments, 1),
				_this = this,
				_function = function() {
					return _this.apply(this instanceof _dummy ? this : context,
						_concat.call(_arguments, _slice.call(arguments, 0)));
				},
				_dummy = function() {};
			_dummy.prototype = _this.prototype;
			_function.prototype = new _dummy();
			return _function;
		}
	});
	
	nano.extend(Object, 'safe', {
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
		keys : function(o) {
			var result = [];
			for(var name in o) {
				if (o.hasOwnProperty(name))
				  result.push(name);
			}
			return result;
		}
	});

	nano.extend(Array, 'safe', {
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
		isArray : Array.isArray || function(o) {
			return Object.prototype.toString.call(o) === '[object Array]';
		}
	});
})();

nano.extend({
	rich : function () {
		nano.implement(Number, {
			between: function (n1, n2, equals) {
				return (n1 <= n2) && (
					(equals == 'L'   && this == n1) ||
					(equals == 'R'   && this == n2) ||
					(  this  > n1    && this  < n2) ||
					([true, 'LR', 'RL'].contains(equals) && (n1 == this || n2 == this))
				);
			},
			equals : function (to, accuracy) {
				if (arguments.length == 1) accuracy = 8;
				return this.toFixed(accuracy) == to.toFixed(accuracy);
			}
		});
	}
});