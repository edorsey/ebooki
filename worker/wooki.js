var program = require('commander'),
	Config = require('../lib/config'),
	Tools = require('../lib/tools'),
	fs = require('fs'),
	packageJSON = JSON.parse(fs.readFileSync('package.json'));

var WookiWorker = function() {
	program
       .option('-c, --config <path>', 'Specify the config file')
       .option('-#, --hash-string <string>', 'Create an hash for a string')
       .option('-s, --sample-config', 'Dumps a config file template and exits')
       .option('-v, --package-version [version string]', 'Gets/sets current version')
       .parse(process.argv);

    this.setDefaults();

    this.callOptions();

    this.work();
}

WookiWorker.prototype.optionFns = {
	'config' : function(path) {
		if (program.config && !fs.existsSync('../' + program.config)) {
			Config.load(program.config);
		}
		else {
			program.help();
		}
	},
	'sample-config' : function() {
		if (program.sampleConfig) {
			console.log(Config.sample());
  			process.exit(0);
  		}
	},
	'hash-string' : function() {
		if (program.hashString) {
		  console.log(Tools.hashify(program.hashString));
		  process.exit(0);
		}
	},
	'package-version' : function() {
		if (program.packageVersion ) {
			packageJSON['version'] = program.packageVersion;
			fs.writeFile('package.json', JSON.stringify(packageJSON, null, " "), function (err) {
			  if (err) throw err;
			  console.log('Version saved!');
			  process.exit(0);
			});
		}
	}
}

WookiWorker.prototype.setDefaults = function() {
	if (!program.config) {
		program.config = "config.yaml";
	}
}

WookiWorker.prototype.callOptions = function() {
	for (var i = 0; i < program.options.length; i++) {
		var fn = this.optionFns[program.options[i].long.replace("--","")];
		if (typeof(fn) == "function") {
			fn();
		}
	}
}

WookiWorker.prototype.work = function () {
	//console.log(program);
}

module.exports = new WookiWorker();