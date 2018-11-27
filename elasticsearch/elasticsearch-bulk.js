module.exports = function (RED) {
    "use strict";

    function elasticsearchBulkNode(config) {
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
                    config.query = config.query || msg.query;

                    var bulkConfig = {
                        body : []
                    };

                    if (config.index) {
                        bulkConfig.index = config.index;
                    }

                    if (config.esType) {
                        bulkConfig.type = config.esType;
                    }
                    
                    if (msg.payload && msg.payload.length > 0) {
                        for (var i in msg.payload) {
                            processData(msg.payload[i], bulkConfig, node);           
                        }
                    }
                                 
                    console.log("bulkConfig", bulkConfig)   
                    serverConfig.client.bulk(bulkConfig).then(function (resp) {
                        msg.payload = resp;
                        node.send(msg);
                    }, function (err) {
                        msg.payload = err;
                        node.send(msg);
                    });
                });
               
            }

            node.on("error", function (error) {
                node.error("elasticsearchBulkNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchBulkNode" + err);
            console.log(err);
        }
    }

    function processData(current, bulkConfig, node) {
        try {
            let actionDescription = {}, action = {};
            
            let actionType = current.meta.action;
            delete current.meta.action
            actionDescription[actionType] = current.meta;
    
            switch(actionType) {
                case 'update': 
                    action = {
                        doc : current.data
                    }
                    break;
                case 'delete': 
                    action = null;
                default: 
                    action = current.data
            }
                                
            if (actionDescription) {
                bulkConfig.body.push(actionDescription);
            }
    
            if (action) {
                bulkConfig.body.push(action);
            }
        }  catch (err) {
            node.error("processData" + err);
            console.log(err);
        }
    }

    RED.nodes.registerType("elasticsearch-bulk", elasticsearchBulkNode);
};