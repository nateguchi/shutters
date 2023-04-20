if (!process.env.MQTT_URL) require('dotenv').config();
const mqtt = require('async-mqtt');
const MQTTCover = require('./MQTTCover');
const BlindController = require('./BlindController');
const WILL_TOPIC = `nat-home-automation/dead/shutter-controller`;

const client = mqtt.connect(process.env.MQTT_URL, {
	will: {
		topic: WILL_TOPIC,
		payload: 'offline',
		retain: true,
	},
});
client.willTopic = WILL_TOPIC;
client.on('connect', () => {
	console.log('Connected');
	client.publish(WILL_TOPIC, 'online', { retain: true });
});

setInterval(() => client.publish(WILL_TOPIC, 'online', { retain: true }), 5000);

const NUMBER_OF_SHUTTERS = 7;

const device = {
	identifiers: `shutters1`,
	manufacturer: 'Thomas Sanderson',
	model: 'Shutters',
	name: 'Study Shutters',
	via_device: 'Nat-Shutter-Controller',
};

const bc = new BlindController(3);

for (let i = 0; i < NUMBER_OF_SHUTTERS; i += 1) {
	const cover = new MQTTCover(
		`shutter${i}`,
		`Shutter ${i + 1}`,
		device,
		client
	);

	cover.on('position', (x) => {
		const p = Number(x) / 100;
		bc.setBlindPosition(i, p);
		cover.updatePosition(x);
	});

	cover.on('command', (y) => {
		if (y == 'STOP') {
		} else if (y == 'OPEN') {
			bc.setBlindPosition(i, 1);
			cover.updatePosition(100);
		} else if (y == 'CLOSE') {
			bc.setBlindPosition(i, 0);
			cover.updatePosition(0);
		}
	});
}
