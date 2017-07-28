const fs = require('fs');
const path = require("path");
const variables = require("./variables.js");
const findFile = require("./find-file.js");
const replaceRelativeImportPaths = require("./replace-relative-import-paths.js");
const updateImportObjectLocationInTarget = require("./update-import-object-location-in-target.js");

function replaceAllImportsInCurrentLayer(i, importObjs, updatedFileContent, dir, cb) {
	if (i < importObjs.length) {
		var importObj = importObjs[i];

		//replace contracts aliases
		if (importObj.contractName) {
			updatedFileContent = updatedFileContent.replace(importObj.alias + ".", importObj.contractName + ".");
		}
		
		importObj = updateImportObjectLocationInTarget(importObj, updatedFileContent);
		var importStatement = updatedFileContent.substring(importObj.startIndex, importObj.endIndex);

		var fileExists = fs.existsSync(dir + importObj.dependencyPath, fs.F_OK);
		if (fileExists) {
			var importedFileContent = fs.readFileSync(dir + importObj.dependencyPath, "utf8");
			replaceRelativeImportPaths(importedFileContent, path.dirname(importObj.dependencyPath) + "/", function(importedFileContentUpdated) {
				if (variables.importedSrcFiles.indexOf(path.basename(dir + importObj.dependencyPath)) === -1) {
					variables.importedSrcFiles.push(path.basename(dir + importObj.dependencyPath));
					updatedFileContent = updatedFileContent.replace(importStatement, importedFileContentUpdated);
				}
				else updatedFileContent = updatedFileContent.replace(importStatement, "");

				i++;
				replaceAllImportsInCurrentLayer(i, importObjs, updatedFileContent, dir, cb);
			});
		} else {
			console.log("!!!" + importObj.dependencyPath + " SOURCE FILE NOT FOUND. TRY TO FIND IT RECURSIVELY!!!");
			findFile.byNameAndReplace(dir.substring(0, dir.lastIndexOf("/")), path.basename(importObj.dependencyPath), updatedFileContent, importStatement, function(_updatedFileContent) {
				i++;
				replaceAllImportsInCurrentLayer(i, importObjs, _updatedFileContent, dir, cb);
			});
		}
	} else cb(updatedFileContent);
}

module.exports = replaceAllImportsInCurrentLayer;