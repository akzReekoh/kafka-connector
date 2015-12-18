/*
 * Just a sample code to test the connector plugin.
 * Kindly write your own unit tests for your own plugin.
 */
'use strict';

var cp     = require('child_process'),
	assert = require('assert'),
	connector;

var topic = new Date().getTime().toString();

var options = {
	host: 'ec2-52-90-67-114.compute-1.amazonaws.com',
	port: 2181,
	requireAcks: 1,
	ackTimeoutMs: 100,
	clientId: 'my-kafka',
	sessionTimeout: 30000,
	spinDelay: 1000,
	retries: 0,
	topic: topic,
	partition: 0,
	version: '0.8.x and up'
};

describe('Connector v0.8.x and up', function () {
	this.slow(5000);

	after('terminate child process', function () {
		connector.kill('SIGKILL');
	});

	describe('#spawn', function () {
		it('should spawn a child process', function (done) {
			assert.ok(connector = cp.fork(process.cwd()), 'Child process not spawned.');
			done();
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(5000);

			connector.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			connector.send({
				type: 'ready',
				data: {
					options: options
				}
			}, function (error) {
				assert.ifError(error);
			});
		});
	});


	describe('#topic', function () {
		it('should create a topic within 5 seconds', function (done) {
			this.timeout(5000);
			var kafka = require('kafka-node'),
				Producer = kafka.Producer,
				url = options.host + ':' + options.port + '/',
				client = new kafka.Client(url),
				producer = new Producer(client);

			// Create topics async
			producer.on('ready', function () {
				producer.createTopics([options.topic], false, function (err) {
					assert.ifError(err);
					done();
				});
			});

		});
	});

	describe('#data', function () {
		it('should send the data', function (done) {
			connector.send({
				type: 'data',
				data: {
					key1: 'value1',
					key2: 121,
					key3: 40
				}
			}, done);
		});
	});


	describe('#consumer', function () {
		it('should consume the data within 10 seconds', function (done) {
			this.timeout(10000);

				var kafka = require('kafka-node'),
					Consumer = kafka.Consumer,
					url = options.host + ':' + options.port + '/',
					client = new kafka.Client(url),
					consumer = new Consumer(
						client,
						[
							{ topic: options.topic, partition: options.partition}
						],
						{
							autoCommit: true
						}
					);

				consumer.on('message', function (message) {
					assert.equal(JSON.stringify({
						key1: 'value1',
						key2: 121,
						key3: 40
					}), message.value);
					done();
				});

		});
	});


});