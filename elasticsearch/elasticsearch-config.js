module.exports = function (RED) {
    'use strict'
    let elasticsearch = require("elasticsearch");

    function serverConfigNode(config) {
     
        var node = this;
        RED.nodes.createNode(node, config);

        node.server =  config.server;
        node.port = config.port || 9200;
        node.name = config.name;
        node.apiVersion = config.apiVersion;

        createClient(node);
        
        node.on("error", function(error) {
            node.error("gRPC Server Error - " + error);
            console.log(error);
        });
		
        node.on("close", function(done) {
            if (this.localServer) {
                stopServer(this);
                console.log("### gRPC server stopped ###");
            }
            done();
        });
    }	

    function createClient(node) {
        try {             
            if (!node.client) {
                node.client = new elasticsearch.Client({
                    hosts : [ 
                        node.server
                    ],
                    apiVersion: node.apiVersion
                });
            }
        } catch (err) {
            node.error("createClient - " + err);
            console.log(err);
        }
    }
	

    RED.nodes.registerType("elasticsearch-config", serverConfigNode, {});	
}