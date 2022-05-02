import * as fs from 'fs';

const TEST_DATA =
	'tests/data/b3499e923745022c1d38cca770226567_diagnostics_2022.05.02_16.04.10+0000.txt';

try {
	const data = fs.readFileSync(TEST_DATA, 'utf8');
	console.log(data);
} catch (err) {
	console.error(err);
}
