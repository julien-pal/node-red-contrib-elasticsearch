module.exports = function (RED) {
    "use strict";

    function elasticsearchIndexNode(config) {
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
                        "type":  config.esType,
                        "body" : msg.payload
                    }

                    if (msg.index) {
                        indexConfig.index = msg.index;
                    }

                    if (msg.esType) {
                        indexConfig.type = msg.esType;
                    }

                    if (msg.id) {
                        indexConfig.id = msg.id;
                    }

                    if (msg.payload._id) {
                        indexConfig.id = msg.payload._id;
                        delete msg.payload._id;
                    }            
                    serverConfig.client.index(indexConfig).then(function (resp) {
                        msg.payload = resp;
                        node.send(msg);
                    }, function (err) {
                        node.log("elasticsearchIndexNode" + err);
                        console.log(err);
                        msg.payload = err;
                        node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchIndexNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchIndexNode" + err);
            console.log(err);
        }
    }

    RED.nodes.registerType("elasticsearch-index", elasticsearchIndexNode);
};