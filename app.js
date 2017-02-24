'use strict'

let reekoh = require('reekoh')
let _plugin = new reekoh.plugins.Connector()
let async = require('async')
let isArray = require('lodash.isarray')
let isPlainObject = require('lodash.isplainobject')
let producer = null

let sendData = (data, callback) => {
  data = JSON.stringify(data)
  if (_plugin.config.version === '0.8.x and up') {
    let payloads = [{ topic: _plugin.config.topic, messages: data, partition: _plugin.config.partition }]

    producer.send(payloads, (err) => {
      if (!err) {
        _plugin.log(JSON.stringify({
          title: 'Data Successfully sent to Kafka.',
          data: data
        }))
      }

      callback(err)
    })
  } else {
    try {
      producer.send(data)
      _plugin.log(JSON.stringify({
        title: 'Data Successfully sent to Kafka.',
        data: data
      }))
    } catch (e) {
      callback(e)
    }
  }
}

/**
 * Emitted when device data is received.
 * This is the event to listen to in order to get real-time data feed from the connected devices.
 * @param {object} data The data coming from the device represented as JSON Object.
 */
_plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (error) => {
      if (error) {
        console.error(error)
        _plugin.logException(error)
      }
    })
  } else if (isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (error) => {
      if (error) {
        console.error(error)
        _plugin.logException(error)
      }
    })
  } else {
    _plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 */
_plugin.once('ready', () => {
  _plugin.config.port = ((_plugin.config.port) ? _plugin.config.port : 9092)

  if (_plugin.config.version === '0.8.x and up') {
    let clientOpt = {}
    let url = _plugin.config.host + ':' + _plugin.config.port + '/'

    clientOpt.sessionTimeout = ((_plugin.config.sessionTimeout) ? _plugin.config.sessionTimeout : 30000)
    clientOpt.spinDelay = ((_plugin.config.spinDelay) ? _plugin.config.spinDelay : 1000)
    clientOpt.retries = ((_plugin.config.retries) ? _plugin.config.retries : 0)

    _plugin.config.requireAcks = ((_plugin.config.requireAcks) ? _plugin.config.requireAcks : 1)
    _plugin.config.ackTimeoutMs = ((_plugin.config.ackTimeoutMs) ? _plugin.config.ackTimeoutMs : 100)
    _plugin.config.partition = ((_plugin.config.partition) ? _plugin.config.partition : 0)

    _plugin.config.clientId = ((_plugin.config.clientId) ? _plugin.config.clientId : 'reekoh-client')

    let kafka8 = require('kafka-node')
    let HighLevelProducer = kafka8.HighLevelProducer
    let isConnected = false
    let client = new kafka8.Client(url, _plugin.config.clientId, clientOpt)

    producer = new HighLevelProducer(client, {requireAcks: _plugin.config.requireAcks, ackTimeoutMs: _plugin.config.ackTimeoutMs})

    setTimeout(() => {
      if (!isConnected) {
        _plugin.logException('Cannot connect to Kafka. Host: ' + _plugin.config.host + ' Port: ' + _plugin.config.port)
        process.exit(1)
      }
    }, 5000)

    producer.on('ready', () => {
      isConnected = true
      _plugin.log('Kafka producer ready version: ' + _plugin.config.version)
    })

    producer.on('error', (prodErr) => {
      console.error('Error connecting in Kafka broker.', prodErr)
      _plugin.logException(prodErr)
    })
  } else {
    let kafka7 = require('kafka')

    producer = new kafka7.Producer({
      host: _plugin.config.host,
      port: _plugin.config.port,
      topic: _plugin.config.topic,
      partition: _plugin.config.partition
    })

    producer.connect()

    producer.on('connect', (err) => {
      if (err) _plugin.logException(err)
      else _plugin.log('Kafka producer ready version: ' + _plugin.config.version)
    })

    producer.on('error', (prodErr) => {
      console.error('Error connecting in Kafka broker.', prodErr)
      _plugin.logException(prodErr)
    })
  }

  _plugin.log('Kafka Connector has been initialized.')
  _plugin.emit('init')
})

module.exports = _plugin
