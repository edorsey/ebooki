var _ = require('underscore'),
	defaultOptions = {
		name : "thing"
	};

var baseThing = function(options) {
	this.options = options;
}

module.exports = baseThing;