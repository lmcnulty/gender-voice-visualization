
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
for (let e of ['div', 'span', 'img', 'canvas', 'svg', 'option', 'button']) {
	window[e] = function() {
		let args = [e].concat(Array.from(arguments));
		return create.apply(null, args);
	}
}

function downloadFile(content, title) {
	create('a', { download : title, href : content }).click();
}

class StateManager {

	constructor() {
		this.state = {}
	}

	init(key, value) {
		if (this.state.hasOwnProperty(key)) {
			throw `Key '${key}' has already been initialized.`
		}
		this.state[key] = {'value' : value, 'updaters' : []}
	}

	checkKey(key) {
		if (!this.state.hasOwnProperty(key)) {
			throw `Key '${key}' does not exist in state object.`
		}
	}

	update(key) {
		
		for (let updater of this.state[key].updaters) {
			let current = {};
			for (let updaterKey of updater.keys) {
				current[updaterKey] = this.state[updaterKey].value
			}
			updater.callback(current);
		}
	}

	set(key, value) {
		this.checkKey(key);
		this.state[key].value = value;
		this.update(key);
	}

	mutate(key, callback) {
		this.checkKey(key);
		callback(this.state[key].value);
		this.update(key);
	}

	// This should be used for immutable access,
    // but actually making a copy each time would probably be inefficient,
	// so just be disciplined for now.
	get(key) {
		this.checkKey(key);
		return this.state[key].value;
	}

	render(keys, callback) {
		let current = {}
		for (let key of keys) {
			this.checkKey(key);
			this.state[key].updaters.push({
				"callback": callback,
				"keys": keys
			});
			current[key] = this.state[key].value;
		}
		callback(current);
	}

	sync(stateKey, element, key) {
		this.init(stateKey, element[key]);

		let thisState = this;
		element.addEventListener('change', evt => {
			thisState.set(stateKey, evt.target[key]);
		});

		this.render([stateKey], current => {
			element[key] = current[stateKey];
		});

		this.set(stateKey, element[key]);
	}
}
