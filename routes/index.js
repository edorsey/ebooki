var folderInitialize = require('../utilities/folderInitialize');

module.exports = function(app) {
	return folderInitialize(__dirname, app);
}