import { readdirSync } from 'fs';

export const getFolders = (source: string) =>
	readdirSync(source, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

export const osPathFixer = (path: string): string => {
	return process.platform === 'win32' ? path.slice(1) : path;
};
// LOGIC FOR THE MOVED FILE !!!
const diffLevelsLogic = (
	anotherFilePathLength: number,
	currentFilePathLength: number,
	anotherFilePathParts: string[],
	currentFilePathParts: string[],
	theAddedPart: string,
	anotherFilePath: string,
	theBracesImport: string,
	depName: string,
	line: string
) => {
	let index = 0;

	const biggerArrayLength = anotherFilePathLength > currentFilePathLength ? anotherFilePathParts.length : currentFilePathParts.length;
	// compare array sequentially
	while (anotherFilePathParts[index] === currentFilePathParts[index] && index < biggerArrayLength) {
		index++;
	}

	// console.log('INDEX', index);
	// console.log('currentFIlePathLength', currentFilePathLength);

	// 5. if files are on different levels
	if (anotherFilePathLength !== currentFilePathLength) {
		if (index === 0) {
			for (let i = 0; i < currentFilePathLength; i++) {
				theAddedPart = theAddedPart + '../';
			}
			line = 'import ' + theBracesImport + '"' + theAddedPart + anotherFilePath + '";';
			// 6. if in the same
		} else {
			// if otherfile deeper

			if (anotherFilePathLength === biggerArrayLength) {
				if (index === currentFilePathLength) {
					for (let i = 0; i < index; i++) {
						anotherFilePathParts.shift();
					}
					line = 'import ' + theBracesImport + '"' + './' + anotherFilePathParts.join('/') + '/' + depName + '";';
				} else {
					for (let i = 0; i < index; i++) {
						anotherFilePathParts.shift();
					}
					for (let i = 0; i < currentFilePathLength - index; i++) {
						theAddedPart = theAddedPart + '../';
					}
					line = 'import ' + theBracesImport + '"' + theAddedPart + anotherFilePathParts.join('/') + '/' + depName + '";';
				}
			}
			// if current file deeper LACKS LOGIC
			else if (currentFilePathLength === biggerArrayLength) {
				for (let i = 0; i < index; i++) {
					anotherFilePathParts.shift();
				}
				for (let i = 0; i < currentFilePathLength - index; i++) {
					theAddedPart = theAddedPart + '../';
				}
				console.log('ANOTHER PARTS LENGTH AFTER SHIFTING', anotherFilePathParts.length);

				if (anotherFilePathParts.length) {
					line = 'import ' + theBracesImport + '"' + theAddedPart + anotherFilePathParts.join('/') + '/' + depName + '";';
					// if after shifting there's no diff path left
				} else {
					line = 'import ' + theBracesImport + '"' + theAddedPart + depName + '";';
				}
			}
		}
	}
	// if on the same
	else {
		// if in completely different folders ( on the same level )
		if (index === 0) {
			for (let i = 0; i < currentFilePathLength; i++) {
				theAddedPart = theAddedPart + '../';
			}
			line = 'import ' + theBracesImport + '"' + theAddedPart + anotherFilePath + '";';
		}
		// if in the same folder
		else if (index === currentFilePathLength) {
			line = 'import ' + theBracesImport + '"' + './' + depName + '";';
		}

		// if some folders are the same
		else {
			for (let i = 0; i < index; i++) {
				anotherFilePathParts.shift();
			}
			for (let i = 0; i < currentFilePathLength - index; i++) {
				theAddedPart = theAddedPart + '../';
			}

			if (anotherFilePathParts.length) {
				line = 'import ' + theBracesImport + '"' + theAddedPart + anotherFilePathParts.join('/') + '/' + depName + '";';
				// if after shifting there's no diff path left
			} else {
				line = 'import ' + theBracesImport + '"' + theAddedPart + depName + '";';
			}
		}
	}
	return line;
};
export const pathLogic = (otherFilePath: string, movedFilePath: string, depName: string, line: string, theBracesImport?: string) => {
	const otherFilePathParts = otherFilePath.split('/');
	const currentFilePathParts = movedFilePath.split('/');

	// removing the depName
	otherFilePathParts.pop();
	currentFilePathParts.pop();

	const otherFilePathLength = otherFilePathParts.length;
	const currentFilePathLength = currentFilePathParts.length;

	let theAddedPart = '';

	// 1. if both files is in root
	if (!otherFilePathLength && !currentFilePathLength) {
		line = 'import ' + theBracesImport + '"' + './' + depName + '";';
	}
	// 2. if otherfile is in root and the movedFile is not
	else if (!otherFilePathLength && currentFilePathLength) {
		for (let i = 0; i < currentFilePathLength; i++) {
			theAddedPart = theAddedPart + '../';
		}
		line = 'import ' + theBracesImport + '"' + theAddedPart + depName + '";';
	}
	// 3. if movedfile is in root and the otherfile is not
	else if (otherFilePathLength && !currentFilePathLength) {
		line = 'import ' + theBracesImport + '"' + './' + otherFilePath + '";';
	} else {
		// if different levels
		line = diffLevelsLogic(
			otherFilePathLength,
			currentFilePathLength,
			otherFilePathParts,
			currentFilePathParts,
			theAddedPart,
			otherFilePath,
			theBracesImport!,
			depName,
			line
		);
	}

	return line;
};

// LOGIC FOR THE REST OF THE FILES, that is also suitable for the global edit..
export const pathLogic2 = (currentFilePath: string, anotherFilePath: string, depName: string, line: string, theBracesImport?: string) => {
	const currentFilePathParts = currentFilePath.split('/');
	const anotherFilePathParts = anotherFilePath.split('/');

	// removing the depName
	currentFilePathParts.pop();
	anotherFilePathParts.pop();

	const currentFilePathLength = currentFilePathParts.length;
	const anotherFilePathLength = anotherFilePathParts.length;

	let theAddedPart = '';

	// 1. if both files are in root
	if (!currentFilePathLength && !anotherFilePathLength) {
		line = 'import ' + theBracesImport + '"' + './' + depName + '";';
		// 2. if current file is in root and other file is not
	} else if (!currentFilePathLength && anotherFilePathLength) {
		line = 'import ' + theBracesImport + '"' + './' + anotherFilePath + '";';
		// 3. if current file is not in the root and other is
	} else if (currentFilePathLength && !anotherFilePathLength) {
		for (let i = 0; i < currentFilePathLength; i++) {
			theAddedPart = theAddedPart + '../';
		}
		line = 'import ' + theBracesImport + '"' + theAddedPart + depName + '";';
	}
	// 4. if both files are not in root
	else {
		line = diffLevelsLogic(
			anotherFilePathLength,
			currentFilePathLength,
			anotherFilePathParts,
			currentFilePathParts,
			theAddedPart,
			anotherFilePath,
			theBracesImport!,
			depName,
			line
		);
	}
	return line;
};

export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./styles.css">
		<script defer src="script.js"></script>
        <title>Graph</title>
    </head>

    <body>
        <section class="graph">
	`;
export const cssTemplate = `
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	background: rgb(60, 1, 102);
	background: linear-gradient(8deg, rgba(60, 1, 102, 0.8139706566220238) 0%, rgba(0, 238, 255, 1) 200%);
	height: 100vh;
}
.fullsvg {
	pointer-events: none;
	position: absolute;
	z-index: -1;
}

.fullFile {
	margin: 0.4em;
	width: fit-content;
}
.fullFunc {
	background-color: rgb(168, 205, 244);
	display: flex;
	flex-direction: row;
	justify-content: center;
	flex-wrap: wrap;
	border: 3px solid grey;
	border-radius: 10px;
	margin: 0.5em;
	padding: 0.3em;
}
.functionsPlusInh {
	display: flex;
	flex-direction: row;
	width: fit-content;
	justify-content: space-between;
	align-items: center;
}
.functions {
	display: flex;
	flex-direction: column;
	width: fit-content;
}

.func {
	border: 3px solid rgb(73, 73, 73);
	border-radius: 7px;
	margin: 1em;
	padding: 0.5em;
	font-size: 1.125rem;
	width: fit-content;
}
.fileName {
	text-align: center;
}
.external {
	background-color: rgb(124, 124, 175);
}
.payable {
	background-color: tomato;
}
.pure {
	background-color: grey;
}
.contract-inheritance {
	background-color: orange;
	border: 3px solid rgb(178, 43, 43);
	width: fit-content;
	margin: 1em;
	padding: 0.5em;
}
.contract-inheritance__funcs {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
}
.inheritance {
	background-color: chartreuse;
}
.inh-text {
	text-align: center;
}
.inh-parent {
	background-color: antiquewhite;
	padding: 0.3em;
	margin: 0.5em;
	border: 1px solid grey;
	border-radius: 50%;
	width: fit-content;
	height: fit-content;
}

`;
export const jsTemplate = `
window.onload = () => {
	let counter = 1;
	const funcPlusInh = document.querySelectorAll('.functionsPlusInh');
	const section = document.querySelector('section');
	//FOR EACH FILE
	funcPlusInh.forEach((el) => {
		// IF IT HAS INH PARENT
		if (el.querySelector('.inh-parent')) {
			const lineContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			lineContainer.setAttribute('class', 'fullsvg');
			lineContainer.setAttribute('width', '100%');
			lineContainer.setAttribute('height', '100%');
			const inhCoord = el.querySelector('.inh-parent').getBoundingClientRect();

			const allFullFuncs = el.querySelectorAll('.fullFunc');
			allFullFuncs.forEach((funcEl) => {
				if (funcEl.querySelector('.inheritance > div.func')) {
					const funcCoord = funcEl.getBoundingClientRect();

					const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

					newLine.setAttribute('id', 'line' + counter);
					newLine.setAttribute('x1', funcCoord.left + funcCoord.width / 2);
					newLine.setAttribute('y1', funcCoord.top + funcCoord.height / 2);
					newLine.setAttribute('x2', inhCoord.left + inhCoord.width / 2);
					newLine.setAttribute('y2', inhCoord.top + inhCoord.height / 2);
					newLine.setAttribute('style', 'stroke: red; stroke-width: 4;');

					lineContainer.append(newLine);
					section.prepend(lineContainer);

					counter++;
				}
			});
		}
	});
};

`;
