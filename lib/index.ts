import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

const IN_FILE = 'tests/data/diagnostics.txt';
const OUT_FILE = 'out/diagnostics.json';

const RE_STDOUT = /STDOUT:(.*)(?:STDERR:|$)/s;
const RE_STDERR = /STDOUT:.*STDERR:(.*)/s;

let out = {} as any;

try {
	const data = fs.readFileSync(IN_FILE, 'utf8');
	const stdout = data.match(RE_STDOUT)?.[1];
	const stderr = data.match(RE_STDERR)?.[1];

	if (stdout) {
		out = _.keyBy(parseStdout(stdout), 'command');
	}
	if (stderr) {
		out = _.merge(out, _.keyBy(parseStderr(stderr), 'command'));
	}
} catch (err) {
	console.error(err);
}

if (!fs.existsSync(path.dirname(OUT_FILE))) {
	fs.mkdirSync(path.dirname(OUT_FILE));
}

console.debug(out);

fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));

function parseStdout(data: string) {
	const regex = {
		command: /^--- ([\s\S]+?) ---*$/,
		timestamp: /^[\s:0-9\.+-]+$/,
		real: /real[\s]+([\s0-9\.smh]+)$/,
		user: /^user[\s]+([\s0-9\.smh]+)$/,
		sys: /^sys[\s]+([\s0-9\.smh]+)$/,
	};

	const lines = data.split(/[\r\n]+/);

	const value = [] as any;
	let obj = {} as any;

	lines.forEach((line) => {
		if (line.length === 0) {
			return;
		} else if ((!obj.time || obj.sys) && regex.command.test(line)) {
			if (obj !== {}) {
				value.push(obj);
				obj = {};
			}
			obj.command = line.match(regex.command)?.pop();
		} else if (obj.command && regex.timestamp.test(line)) {
			obj.time = line.match(regex.timestamp)?.pop();
		} else if (obj.command && obj.time && regex.real.test(line)) {
			obj.real = line.match(regex.real)?.pop();
		} else if (obj.command && obj.real && regex.user.test(line)) {
			obj.user = line.match(regex.user)?.pop();
		} else if (obj.command && obj.user && regex.sys.test(line)) {
			obj.sys = line.match(regex.sys)?.pop();
		} else if (obj.command && obj.time && !obj.real) {
			obj.stdout = [obj.stdout, line].filter((item) => item).join('\n');
		}
	});
	return value;
}

function parseStderr(data: string) {
	const regex = {
		command: /^--- ([\s\S]+?) ---*$/,
	};

	const lines = data.split(/[\r\n]+/);

	const value = [] as any;
	let obj = {} as any;

	lines.forEach((line) => {
		if (line.length === 0) {
			return;
		} else if (regex.command.test(line)) {
			if (obj !== {}) {
				value.push(obj);
				obj = {};
			}
			obj.command = line.match(regex.command)?.pop();
		} else if (obj.command) {
			obj.stderr = [obj.stderr, line].filter((item) => item).join('\n');
		}
	});
	return value;
}
