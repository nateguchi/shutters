const { EventEmitter } = require('events');

class MQTTCover extends EventEmitter {
	constructor(id, name, device, client) {
		super();
		this.id = id;
		this.name = name;
		this.device = device;
		this.client = client;

		this.message = this.message.bind(this);
		this.publish();
		this.client.on('message', this.message);
		this.subscribe();
	}

	buildTopic(ending) {
		return `homeassistant/cover/${this.device.identifiers}/${this.id}/${ending}`;
	}

	updatePosition(state) {
		this.client.publish(this.buildTopic('position'), state.toString());
	}

	message(topic, state) {
		if (topic === this.buildTopic('set')) {
			this.emit('command', state);
		} else if (topic === this.buildTopic('set_position')) {
			this.emit('position', state);
		}
	}

	subscribe() {
		this.client.subscribe(this.buildTopic('set'));
		this.client.subscribe(this.buildTopic('set_position'));
	}

	publish() {
		const payload = JSON.stringify({
			device: this.device,
			command_topic: this.buildTopic('set'),
			position_topic: this.buildTopic('position'),
			set_position_topic: this.buildTopic('set_position'),
			unique_id: `cover${this.device.identifiers}:${this.id}`,
			name: this.name,
			// optimistic: false,
			availability: {
				topic: this.client.willTopic,
			},
			payload_open: 'OPEN',
			payload_close: 'CLOSE',
			payload_stop: 'STOP',
			position_open: 100,
			position_closed: 0,
			// value_template: '{{ value.x }}',
		});
		this.client.publish(this.buildTopic('config'), payload, { retain: true });
	}
}

module.exports = MQTTCover;
