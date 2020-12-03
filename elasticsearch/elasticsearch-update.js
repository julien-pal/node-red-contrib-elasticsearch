module.exports = function (RED) {
  "use strict";

  function elasticsearchUpdateNode(config) {
    try {
      var node = this;
      RED.nodes.createNode(node, config);

      var serverConfig = RED.nodes.getNode(config.server);
      if (!serverConfig.client) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No elasticsearch client found",
        });
      } else {
        node.status({});

        node.on("input", function (msg) {
          var updateConfig = {
            index: config.index,
            body: msg.payload,
            routing: config.routing,
          };

          if (config.esType) {
            updateConfig.type = config.esType;
          }

          if (msg.index) {
            updateConfig.index = msg.index;
          }

          if (msg.esType) {
            updateConfig.type = msg.esType;
          }

          if (msg.esId) {
            updateConfig.id = msg.esId;
          }

          if (msg.payload._id) {
            updateConfig.id = msg.payload._id;
            delete msg.payload._id;
          }

          if (msg.routing) {
            updateConfig.routing = msg.routing;
          }

          serverConfig.client.update(updateConfig).then(
            function (resp) {
              msg.payload = resp;
              node.send(msg);
            },
            function (err) {
              node.error("elasticsearchUpdateNode " + err);
              msg.payload = err;
              node.send(msg);
            }
          );
        });
      }

      node.on("error", function (error) {
        node.error("elasticsearchUpdateNode Error - " + error);
      });

      node.on("close", function (done) {
        if (node.client) {
          delete node.client;
        }
        done();
      });
    } catch (err) {
      node.error("elasticsearchUpdateNode" + err);
    }
  }

  RED.nodes.registerType("elasticsearch-update", elasticsearchUpdateNode);
};
