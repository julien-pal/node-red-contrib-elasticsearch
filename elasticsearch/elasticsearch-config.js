module.exports = function (RED) {
    'use strict'
    let elasticsearch = require("elasticsearch");

    function serverConfigNode(config) {
     
        var node = this;
        RED.nodes.createNode(node, config);

        node.server =  config.server;
        node.name = config.name;
        if(config.timeout) {
            node.timeout = config.timeout;
        } else {
            node.timeout = 30000;
        }
        node.apiVersion = config.apiVersion;

        createClient(node);
        
        node.on("error", function(error) {
            node.error("Elastic Server Error - " + error);
        });
		
        node.on("close", function(done) {
            if (this.localServer) {
                stopServer(this);
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
		    requestTimeout: node.timeout,
                    apiVersion: node.apiVersion
                });
            }
        } catch (err) {
            node.error("createClient - " + err);
        }
    }
	

    RED.nodes.registerType("elasticsearch-config", serverConfigNode, {});	
}
