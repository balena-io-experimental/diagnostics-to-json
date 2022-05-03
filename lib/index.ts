import * as fs from 'fs';
import * as path from 'path';

const IN_FILE = 'tests/data/diagnostics.txt';
const OUT_FILE = 'out/diagnostics.json';

const RE_DIAGNOSE_VERSION = /--- diagnose ([0-9\.]+) ---/;
const RE_STDOUT = /STDOUT:(.*)STDERR:/s;
const RE_STDERR = /STDOUT:.*STDERR:(.*)/s;

const RE_COMMANDS = /(--- ([\s\S]+?) ---)((?:\n(?:[^-\n].*)?)*)/g;
const RE_TRIM = /\n{2,}/g;

const out = {} as any;

try {
	const data = fs.readFileSync(IN_FILE, 'utf8');
	out.diagnose_version = data.match(RE_DIAGNOSE_VERSION)?.pop();
	const stdout = data.match(RE_STDOUT)?.pop();
	const stderr = data.match(RE_STDERR)?.pop();

	out.commands = [];

	let matches = stdout?.matchAll(RE_COMMANDS) || [];

	for (const match of matches) {
		out.commands.push({
			command: match[2],
			stdout: match[3].replace(RE_TRIM, ''),
		});
	}

	matches = stderr?.matchAll(RE_COMMANDS) || [];

	for (const match of matches) {
		out.commands.find((item: any) => item.command === match[2]).stderr =
			match[3].replace(RE_TRIM, '');
	}
} catch (err) {
	console.error(err);
}

console.debug(out);

if (!fs.existsSync(path.dirname(OUT_FILE))) {
	fs.mkdirSync(path.dirname(OUT_FILE));
}

fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
