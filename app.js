'use strict';

var platform = require('./platform'),
	isArray = require('lodash.isarray'),
	isPlainObject = require('lodash.isplainobject'),
	async = require('async'),
	producer, opt = {};

let sendData = (data) => {
	data = JSON.stringify(data);
	if (opt.version === '0.8.x and up') {

		var payloads = [{ topic: opt.topic, messages: data, partition: opt.partition }];

		producer.send(payloads, function (err, ackData) {
			if (!err) {
				platform.log(JSON.stringify({
					title: 'Data Successfully sent to Kafka.',
					data: data
				}));
			} else {
				console.error('Error sending data to Kafka', err);
				platform.handleException(err);
			}
		});

	} else {
		try {
			producer.send(data);
			platform.log(JSON.stringify({
				title: 'Data Successfully sent to Kafka.',
				data: data
			}));
		} catch (e) {
			console.error('Error sending data to Kafka', e);
			platform.handleException(e);
		}
	}
};

platform.on('data', function (data) {
	if(isPlainObject(data)){
		sendData(data);
	}
	else if(isArray(data)){
		async.each(data, (datum) => {
			sendData(datum);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

platform.once('close', function () {
	var domain = require('domain');
	var d = domain.create();

	d.once('error', function(error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
		d.exit();
	});

	d.run(function() {
		// TODO: Release all resources and close connections etc.
		if (producer) producer.close();
		platform.notifyClose(); // Notify the platform that resources have been released.
		d.exit();
	});
});

platform.once('ready', function (options) {

	options.port = ((options.port) ? options.port : 9092);
	opt = {
		topic     : options.topic,
		partition : options.partition,
		version   : options.version
	};

	if (options.version === '0.8.x and up') {
		var clientOpt = {},
		    url = options.host + ':' + options.port + '/';

		clientOpt.sessionTimeout = ((options.sessionTimeout) ? options.sessionTimeout  : 30000);
		clientOpt.spinDelay = ((options.spinDelay) ? options.spinDelay  : 1000);
		clientOpt.retries = ((options.retries) ? options.retries  : 0);

		options.requireAcks = ((options.requireAcks) ? options.requireAcks  : 1);
		options.ackTimeoutMs = ((options.ackTimeoutMs) ? options.ackTimeoutMs  : 100);
		options.partition = ((options.partition) ? options.partition  : 0);

		options.clientId = ((options.clientId) ? options.clientId  : 'reekoh-client');

		var kafka8 = require('kafka-node'),
			HighLevelProducer = kafka8.HighLevelProducer,
			isConnected = false,
			client = new kafka8.Client(url, options.clientId, clientOpt);

		producer = new HighLevelProducer(client, {requireAcks: options.requireAcks, ackTimeoutMs: options.ackTimeoutMs});

		setTimeout(function() {
			if (!isConnected) {
				platform.handleException('Cannot connect to Kafka. Host: ' + options.host + ' Port: ' + options.port );
				process.exit(1);
			}
		}, 5000);

		producer.on('ready', function () {
			isConnected = true;
			platform.log('Kafka producer ready version: ' + options.version);
			platform.notifyReady();
		});


		producer.on('error', function (prodErr) {
			console.error('Error connecting in Kafka broker.', prodErr);
			platform.handleException(prodErr);
		});

	} else {
		var kafka7 = require('kafka');

		producer = new kafka7.Producer({
			host:         options.host,
			port:         options.port,
			topic:        opt.topic,
			partition:    opt.partition
		});

		producer.connect();

		producer.on('connect', function(err) {
			platform.log('Kafka producer ready version: ' + options.version);
			platform.notifyReady();
		});

		producer.on('error', function(prodErr) {
			console.error('Error connecting in Kafka broker.', prodErr);
			platform.handleException(prodErr);
		});
	}

});