module.exports = function (RED) {
    "use strict";

    function elasticsearchGetNode(config) {
        try {
            var node = this;
            RED.nodes.createNode(node, config);

            var serverConfig = RED.nodes.getNode(config.server);
            if (!serverConfig.client) {
                node.status({ fill: "red", shape: "dot", text: "No elasticsearch client found" });
            } else {
                node.status({});
                node.on("input", function (msg) {
                    config.index = config.index || msg.index;
                    config.esType = config.esType || msg.type;
                    config.esId = config.esId || msg.id;

                    var getConfig = {
                        "index": config.index,
                        "type": config.esType,
                        "id": config.esId
                    };

                    serverConfig.client.get(getConfig).then(function (resp) {
                        msg.payload = [];
    
                        if (resp && resp._source) {
                            msg.payload = resp._source;
                        }
                        if (resp._id) {
                            msg.payload._id = resp._id;
                        }
                        node.send(msg);

                    }, function (err) {
                        node.log("elasticsearchGetNode" + err);
                        console.log(err);    
                        msg.payload = [];
                        node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchGetNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchGetNode" + err);
            console.log(err);
        }
    }

    RED.nodes.registerType("elasticsearch-get", elasticsearchGetNode);
};