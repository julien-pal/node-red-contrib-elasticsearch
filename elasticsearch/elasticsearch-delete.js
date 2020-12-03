module.exports = function (RED) {
  "use strict";

  function elasticsearchDeleteNode(config) {
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
          var deleteConfig = {
            index: config.index,
            body: msg.payload,
          };

          if (config.esType) {
            deleteConfig.type = config.esType;
          }

          if (msg.index) {
            deleteConfig.index = msg.index;
          }

          if (msg.type) {
            deleteConfig.type = msg.esType;
          }

          if (msg.id) {
            deleteConfig.id = msg.id;
          }

          if (config.esId || msg.payload._id) {
            deleteConfig.id = config.esId || msg.payload._id;
            if (msg.payload._id) delete msg.payload._id;
          }

          if (!deleteConfig.id) {
            node.status({
              fill: "red",
              shape: "dot",
              text: "No id to delete ...",
            });
          } else {
            serverConfig.client.delete(deleteConfig).then(
              function (resp) {
                msg.payload = resp;
                node.send(msg);
              },
              function (err) {
                node.error("elasticsearchDeleteNode" + err);
                msg.payload = err;
                node.send(msg);
              }
            );
          }
        });
      }

      node.on("error", function (error) {
        node.error("elasticsearchDeleteNode Error - " + error);
      });

      node.on("close", function (done) {
        if (node.client) {
          delete node.client;
        }
        done();
      });
    } catch (err) {
      node.error("elasticsearchDeleteNode" + err);
    }
  }

  RED.nodes.registerType("elasticsearch-delete", elasticsearchDeleteNode);
};
