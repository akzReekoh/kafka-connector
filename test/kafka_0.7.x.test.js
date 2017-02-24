'use strict'

const amqp = require('amqplib')

let topic = new Date().getTime().toString()

const options = {
    host:         'ec2-52-90-39-120.compute-1.amazonaws.com',
    port:         9092,
    topic:        topic,
    partition:    0,
    version:      '0.7.x'
}

let _channel = null
let _conn = null
let app = null

describe('Kafka 0.7.x Connector Test', () => {
  before('init', () => {
    process.env.ACCOUNT = 'adinglasan'
    process.env.CONFIG = JSON.stringify(options)
    process.env.INPUT_PIPE = 'ip.kafka'
    process.env.LOGGERS = 'logger1, logger2'
    process.env.EXCEPTION_LOGGERS = 'ex.logger1, ex.logger2'
    process.env.BROKER = 'amqp://guest:guest@127.0.0.1/'

    amqp.connect(process.env.BROKER)
      .then((conn) => {
        _conn = conn
        return conn.createChannel()
      }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })
  })

  after('close connection', function (done) {
    _conn.close()
    done()
  })

  describe('#start', function () {
    it('should start the app', function (done) {
      this.timeout(10000)
      app = require('../app')
      app.once('init', done)
    })
  })

  describe('#data', () => {
    it('should send data to third party client', function (done) {
      this.timeout(15000)

      let data = {
        key1: 'value1',
        key2: 121,
        key3: 40
      }

      _channel.sendToQueue('ip.kafka', new Buffer(JSON.stringify(data)))
      setTimeout(done, 10000)
    })
  })
})
