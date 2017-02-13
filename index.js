const glob = require('glob');
const path = require('path');
const fsExtra = require('fs-extra');

const elmPackage = require(path.join(process.cwd(), "elm-package.json"));

const moduleRegex = /module (.+?) /;
const globDir = (dir) => {
	return new Promise( (resolve, reject) => {
		glob.glob("**/*elm", { cwd: dir, absolute: true }, (err, data) => {
			if (err) return reject(err.message);

			resolve(data);
		});
	});
};

const readFile = (file) => {
	return new Promise(function(resolve, reject){
		fsExtra.readFile(file, 'utf-8', function(err, data){
			if (err) return reject(err.message);
			
			var moduleLine = data.match(moduleRegex);

			if (!moduleLine || moduleLine.length < 2){
				console.error('No module line found in the file ', file);
			}

			resolve({
				module: moduleLine[1],
				file: file,
				data: data
			});
		});
	});
};


var promises = [];
elmPackage["source-directories"].map(function(dir){
	promises.push(globDir(dir));
});

Promise.all(promises).then(function(data){
	var files = [].concat.apply([], data);

	Promise.all(files.map(readFile)).then(function(textMap){
		const moduleNames = textMap.map((piece) => { return piece.module });
		var output = textMap.map((piece) => {return piece.data }).join("\n\n");
		const regexes = moduleNames.map((name) => {
			var newNew = name.split('.').join()
			return { 
				regex: new RegExp(name + "[.]+"),
				replacement: name[0].toLowerCase() + name.substr(1, name.length),
				importLine: new RegExp("import " + name + ".+\n")
			}; 
		});

		regexes.forEach((regex) => {
			output = output.replace(regex.regex, regex.replacement)
			output = output.replace(regex.importLine, "");
		});

		output = output.replace(/(module .+\n)/g, "------- $1");

		console.log(output);
	});
}).catch(function(err){
	console.error(err);
});