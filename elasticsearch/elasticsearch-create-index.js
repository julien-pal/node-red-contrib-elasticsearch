module.exports = function (RED) {
    "use strict";

    function elasticsearchCreateIndexNode(config) {
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
                        "index": config.index,
                        "body": config.body
                    }

                    if (msg.index) {
                        indexConfig.index = msg.index;
                    }

                    if (msg.payload) {
                        indexConfig.body = msg.payload;
                    }


                    serverConfig.client.indices.create(indexConfig).then(function (resp) {
                        msg.payload = resp;
                        node.send(msg);
                    }, function (err) {
                        node.error("elasticsearchCreateIndexNode " + err);
                        //msg.payload = err;
                        //node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchCreateIndexNode Error - " + error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchCreateIndexNode" + err);
        }
    }

    RED.nodes.registerType("elasticsearch-create-index", elasticsearchCreateIndexNode);
};