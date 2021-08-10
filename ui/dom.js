
let $ = s => document.querySelector(s);
let $$ = s => document.querySelectorAll(s);
function clearSelector(selector) {
	for (let section of $$(selector)) {
			$('#offscreen').appendChild(section);
	}
}
function create(elementType) {

	let newElement = document.createElement(elementType);
	for (let i = 1; i < arguments.length; i++) {
		let currentArgument = arguments[i];		
		if (typeof(currentArgument) === 'string') {
			newElement.innerHTML += currentArgument;
		} else if (Array.isArray(currentArgument)) {
			for (let j = 0; j < arguments[i].length; j++) {
				if (typeof(arguments[i][j]) === 'string') {
					newElement.innerHTML += currentArgument[j];		
				} else {	
					newElement.appendChild(currentArgument[j]);
				}
			}
		} else if (currentArgument instanceof Element) {
			newElement.appendChild(currentArgument);
		} else if (typeof(currentArgument) === 'function') {
			currentArgument(newElement);
		} else {
			Object.getOwnPropertyNames(currentArgument).forEach(
				function (val, idx, array) {
					newElement.setAttribute(val, currentArgument[val]);
				}
			);
		}
	}
	return newElement;
}
for (let e of ['div', 'span', 'img', 'canvas', 'svg', 'option']) {
	window[e] = function() {
		let args = [e].concat(Array.from(arguments));
		return create.apply(null, args);
	}
}
