var fs = require('fs'),
	path = require('path'),
	lodash = require('lodash');

module.exports = function(dirName) {
	if (!dirName) {
		dirName = __dirname;
	}
	fs.readdirSync(dirName)
		.filter(function(file) {
			return ((file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) == '.js'))
		})
		.forEach(function(file) {
			console.log(dirName + "/" + file);
			require(dirName + "/" + file)(app)
    	})
};