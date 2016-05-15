/**
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {

  var appmetrics = require('appmetrics');
  var io = require('socket.io-client');
  var socket;

  function ExistingConfigurationNode(config) {
    RED.nodes.createNode(this,config);
    this.url = config.url;
  }

  RED.nodes.registerType("appmetrics-existing", ExistingConfigurationNode);

  function AppmetricsNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('close', function() {
      stopLocalMonitoring();
      stopRemoteMonitoring();
    });
      
    //Get configuration, listen on remote or monitor locally
    if (config.mode == "remote") {

      //stop local monitoring
      stopLocalMonitoring();

      this.existing = RED.nodes.getNode(config.existing);
      var url = this.existing.url;

      
      socket = io.connect(url);
      socket.on('connect', function () {
        // socket connected
        node.status({fill:"green",shape:"ring",text:"Connected to "+url});

        socket.on('appmetrics-data', function(data) {
          var msg = {};
          msg.payload = data;
          node.send(msg);
        });
      });

      socket.on('disconnect', function() {
        node.status({});
      });

    } else {

      stopRemoteMonitoring();

      //monitor locally
      appmetrics = appmetrics.monitor();

      var appmetricsData = {};
      var interval = 1000;

      appmetrics.on('cpu', function(cpu) {
          appmetricsData.cpu = cpu;
      });
      appmetrics.on('memory', function(memory) {
          appmetricsData.memory = memory;
      });
      appmetrics.on('eventloop', function(eventloop) {
          appmetricsData.eventloop = eventloop;
      });
      appmetrics.on('gc', function(gc) {
          appmetricsData.gc = gc;
      });
      appmetrics.on('http', function(httpevent) {
          appmetricsData.http = httpevent;
      });
      appmetrics.on('mongo', function(mongo) {
          appmetricsData.mongo = mongo;
      });
      appmetrics.on('mysql', function(mysql) {
          appmetricsData.mysql = mysql;
      });
      appmetrics.on('mqtt', function(mqtt) {
          appmetricsData.mqtt = mqtt;
      });
      appmetrics.on('mqlight', function(mqlight) {
          appmetricsData.mqlight = mqlight;
      });
      appmetrics.on('leveldown', function(leveldown) {
          appmetricsData.leveldown = leveldown;
      });
      appmetrics.on('redis', function(redis) {
          appmetricsData.redis = redis;
      });
      appmetrics.on('memcached', function(memcached) {
          appmetricsData.memcached = memcached;
      });
      appmetrics.on('oracledb', function(oracledb) {
          appmetricsData.oracledb = oracledb;
      });
      appmetrics.on('oracle', function(oracle) {
          appmetricsData.oracle = oracle;
      });
      appmetrics.on('strong-oracle', function(strongoracle) {
          appmetricsData.strongoracle = strongoracle;
      });
      appmetrics.on('postgres', function(postgres) {
          appmetricsData.postgres = postgres;
      });
      appmetrics.on('riak', function(riak) {
          appmetricsData.riak = riak;
      });

      //Send appmetrics data over socket io
      var msg = {};
      setInterval(function() {
          msg.payload = appmetricsData;
          node.send(msg);
      },interval);
    }
  }

  RED.nodes.registerType('appmetrics', AppmetricsNode);

  //Helper functions
  function stopLocalMonitoring() {
    if (appmetrics) {
      appmetrics.stop();
    }

  }

  function stopRemoteMonitoring() {
    if (socket) {
      socket.removeAllListeners("appmetrics-data");
    }
  }

};


      