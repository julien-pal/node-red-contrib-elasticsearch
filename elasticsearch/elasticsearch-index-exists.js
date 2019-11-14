module.exports = function (RED) {
    "use strict";

    function elasticsearchIndexExistsNode(config) {
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

                    serverConfig.client.cat.indices(indexConfig).then(function (resp) {
                        msg.payload = true;
                        node.send(msg);
                    }, function (err) {
                        //node.error("elasticsearchIndexExistsNode " + err);
                        msg.payload = false;
                        node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchIndexExistsNode Error - " + error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchIndexExistsNode" + err);
        }
    }

    RED.nodes.registerType("elasticsearch-index-exists", elasticsearchIndexExistsNode);
};