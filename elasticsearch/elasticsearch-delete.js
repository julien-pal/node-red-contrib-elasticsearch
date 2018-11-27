module.exports = function (RED) {
    "use strict";

    function elasticsearchDeleteNode(config) {
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

                    var deleteConfig = {
                        "index": config.index,
                        "type": config.esType,
                        "body" : msg.payload
                    }

                    if (config.esId || msg.payload._id) {
                        deleteConfig.id = config.esId || msg.payload._id;
                        if (msg.payload._id) delete msg.payload._id;
                    }

                    if (!config.esId ) {
                        node.status({ fill: "red", shape: "dot", text: "No id to delete ..." });
                    } else {
                        console.log("deleteConfig", deleteConfig)
                        serverConfig.client.delete(deleteConfig).then(function (resp) {
                            msg.payload = resp;
                            node.send(msg);
                        }, function (err) {
                            node.log("elasticsearchDeleteNode" + err);
                            console.log(err);
                            msg.payload = err;
                            node.send(msg);
                        });
                    }
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchDeleteNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchDeleteNode" + err);
            console.log(err);
        }
    }

    RED.nodes.registerType("elasticsearch-delete", elasticsearchDeleteNode);
};