module.exports = function (RED) {
    "use strict";
    function elasticsearchSearchNode(config) {
        try {
            var node = this;
            RED.nodes.createNode(node, config);
            
            var serverConfig = RED.nodes.getNode(config.server);
            if (!serverConfig.client) {
                node.status({ fill: "red", shape: "dot", text: "No elasticsearch client found" });
            } else {
                node.status({});
                node.on("input", function (msg) {
                    var searchConfig = {
                        "index": config.index,
                        "type": config.esType,
                        "body": config.query
                    }

                    if (config.scroll || msg.scroll) {
                        searchConfig.scroll = "1m";
                    }

                    if (msg.index) {
                        searchConfig.index = msg.index;
                    }

                    if (msg.type) {
                        searchConfig.type = msg.type;
                    }

                    if (msg.query) {
                        searchConfig.body = msg.query;
                    }                           
                    msg.payload = [];
                    serverConfig.client.search(searchConfig).then(function (resp) {
                        (function next(resp) {
                            if (!resp.hits || !resp.hits.hits || !resp.hits.hits.length) {
                                node.send(msg);
                                return;
                            } else {
                                for (var i in resp.hits.hits) {
                                    var obj = resp.hits.hits[i]._source;
                                    obj._id = resp.hits.hits[i]._id;
                                    msg.payload.push(obj);
                                    if (msg.payload.length % config.bulkSize == 0) {
                                        node.send(msg);
                                        msg.payload = [];
                                    }
                                }
                                if (!config.scroll) {
                                    node.send(msg);
                                    return;
                                }
                            }

                            if (config.scroll) {
                                var scrollId = resp._scroll_id;
                                // issue the next request
                                serverConfig.client.scroll({
                                    scroll: '1m',
                                    body: scrollId
                                }).then(next);
                            }
                        }(resp));
                    }, function (err) {
                        node.error(err.message);
                        msg.payload = [];
                        msg.error = err;
                        node.send(msg);
                    });
                });
            }

            node.on("error", function (error) {
                node.error("elasticsearchSearchNode Error - " + error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    delete node.client;
                }
                done();
            });
        } catch (err) {
            node.error("elasticsearchSearchNode" + err);
        }
    }

    RED.nodes.registerType("elasticsearch-search", elasticsearchSearchNode);
};