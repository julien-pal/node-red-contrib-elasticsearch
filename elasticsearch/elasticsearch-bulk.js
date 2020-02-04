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
                    var bulkConfig = {
                        index : config.index,
                        type : config.type,
                        query : msg.query,
                        body : []
                    };

                    if (msg.index) {
                        bulkConfig.index = msg.index;
                    }

                    if (msg.type) {
                        bulkConfig.type = msg.type;
                    }

                    if (msg.id) {
                        bulkConfig.id = msg.id;
                    }       
                    
                    if (msg.payload && msg.payload.length > 0) {
                        for (var i in msg.payload) {
                            processData(msg.payload[i], bulkConfig, node);           
                        }
                    }
                                 
                    serverConfig.client.bulk(bulkConfig).then(function (resp) {
                        msg.payload = resp;
                        node.send(msg);
                    }, function (error) {
                        node.error(error)
                        msg.payload = error;
                        node.send(msg);
                    });
                });
               
            }

            node.on("error", function (error) {
                node.error("elasticsearchBulkNode Error - " + error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchBulkNode" + err);
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
                    action = current.data
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
        }
    }

    RED.nodes.registerType("elasticsearch-bulk", elasticsearchBulkNode);
};