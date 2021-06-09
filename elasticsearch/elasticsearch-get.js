module.exports = function (RED) {
  "use strict";

  function elasticsearchGetNode(config) {
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
          var getConfig = {
            index: config.index,
            id: config.esId,
            type: config.esType,
            routing: config.routing,
          };

          if (msg.type) {
            getConfig.type = msg.esType;
          }

          if (msg.index) {
            getConfig.index = msg.index;
          }

          if (msg.routing) {
            getConfig.routing = msg.routing;
          }

          if (msg.id) {
            getConfig.id = msg.id;
          }

          serverConfig.client.get(getConfig).then(
            function (resp) {
              msg.payload = [];

              if (resp && resp._source) {
                msg.payload = resp._source;
              }
              if (resp._id) {
                msg.payload._id = resp._id;
              }
              node.send(msg);
            },
            function (err) {
              node.log("elasticsearchGetNode " + err);
              msg.payload = [];
              node.send(msg);
            }
          );
        });
      }

      node.on("error", function (error) {
        node.error("elasticsearchGetNode Error - " + error);
      });

      node.on("close", function (done) {
        if (node.client) {
          delete node.client;
        }
        done();
      });
    } catch (err) {
      node.error("elasticsearchGetNode " + err);
    }
  }

  RED.nodes.registerType("elasticsearch-get", elasticsearchGetNode);
};
