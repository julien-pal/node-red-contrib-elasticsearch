module.exports = function (RED) {
    "use strict";

    function elasticsearchRefreshIndexNode(config) {
        try {
            var node = this;
            RED.nodes.createNode(node, config);
            
            var serverConfig = RED.nodes.getNode(config.server);
            if (!serverConfig.client) {
                node.status({ fill: "red", shape: "dot", text: "No elasticsearch client found" });
            } else {
                node.status({});

                node.on("input", function (msg) {
                    var indexConfig = {
                        "index": config.index
                    }

                    if (msg.index) {
                        indexConfig.index = msg.index;
                    }

                    serverConfig.client.indices.refresh(indexConfig).then(function (resp) {
                        msg.payload = resp;
                        node.send(msg);
                    }, function (err) {
                        node.error("elasticsearchRefreshIndexNode " + err);
                        msg.payload = err;
                        node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchRefreshIndexNode Error - " + error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchRefreshIndexNode" + err);
        }
    }

    RED.nodes.registerType("elasticsearch-refresh-index", elasticsearchRefreshIndexNode);
};