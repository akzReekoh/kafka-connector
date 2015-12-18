# Kafka Connector Plugin

[![Build Status](https://travis-ci.org/Reekoh/connector-plugin-seed.svg)](https://travis-ci.org/Reekoh/kafka-connector)
![Dependencies](https://img.shields.io/david/Reekoh/connector-plugin-seed.svg)
![Dependencies](https://img.shields.io/david/dev/Reekoh/connector-plugin-seed.svg)
![Built With](https://img.shields.io/badge/built%20with-gulp-red.svg)

Kafka Connector Plugin for the Reekoh IoT Platform. 

Allow Reekoh to connect to a Kafka broker and send data using the producer.

Uses 2 different libraries

Kafka Version | NPM Library  |
--------------|--------------|
0.8.x and up  | kafka-node   |
0.7.x         | kafka        |



**Notes**
- This plugin will only support what the NPM library supports.
- HighLevelProducer object is being used for the version 0.8.x and up version.
- All data will be converted to JSON string "JSON.stringify(data)".