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
    host:         'ec2-52-90-39-120.compute-1.amazonaws.com',
    port:         9092,
    topic:        topic,
    partition:    0,
    version:      '0.7.x'
};

describe('Connector v0.7.x', function () {
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

            var kafka = require('kafka'),
                consumer = new kafka.Consumer({
                // these are the default values
                    host:          options.host,
                    port:          options.port,
                    pollInterval:  2000,
                    maxSize:       1048576 // 1MB
                });

            consumer.on('message', function(topic, message) {
                assert.equal(JSON.stringify({
                    key1: 'value1',
                    key2: 121,
                    key3: 40
                }), message);
                done();
            });

            consumer.connect(function() {
                consumer.subscribeTopic({name: options.topic, partition: options.partition});
            });

        });
    });


});