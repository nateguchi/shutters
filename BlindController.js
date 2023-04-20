const i2cBus = require('i2c-bus');
const { Pca9685Driver } = require('pca9685');

const ON_TIME = 700;
const CONFIG = {
	direction: [false, false, false, true, true, true, true],
	min: [0, 0, 0, 0, 0, 0, 0],
	max: [1, 1, 1, 1, 1, 1, 1],
};

const delay = (t) => new Promise((r) => setTimeout(r, t));

class BlindController {
	constructor(busId) {
		// PCA9685 options
		const options = {
			i2c: i2cBus.openSync(busId),
			address: 0x40,
			frequency: 50,
			debug: true,
		};

		this.pwm = new Pca9685Driver(options, this.error.bind(this));

		this.currentPos = [];

		// set-up CTRL-C with graceful shutdown
		process.on('SIGINT', () => {
			console.log('\nGracefully shutting down from SIGINT (Ctrl-C)');

			this.pwm.dispose();
			setTimeout(process.exit, 1000);
		});
	}

	error(e) {
		if (e) console.error('Issue with servo library', e);
	}

	async setBlindPosition(i, x) {
		const tm = CONFIG.min[i];
		const tma = CONFIG.max[i];
		const trim = tm + (tma - tm) * x;
		const p = CONFIG.direction[i] ? 1 - trim : trim;
		const cp = this.currentPos[i];
		if (cp < p) {
			for (let q = cp; q < p; q += 0.1) {
				this.pwm.setPulseLength(i, 1000 + (2200 - 1000) * q);
				await delay(1000);
			}
		} else {
			for (let q = cp; q > p; q -= 0.1) {
				this.pwm.setPulseLength(i, 1000 + (2200 - 1000) * q);
				await delay(1000);
			}
		}

		this.currentPos[i] = p;
		// await delay(ON_TIME);
		this.pwm.channelOff(i);
	}
}

module.exports = BlindController;
