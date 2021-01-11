module.exports = function (RED) {
  "use strict";
  function elasticsearchSearchNode(config) {
    try {
      var node = this;
      RED.nodes.createNode(node, config);

      var serverConfig = RED.nodes.getNode(config.server);
      if (!serverConfig.client) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No elasticsearch client found",
        });
      } else {
        node.status({});
        node.on("input", function (msg) {
          var searchConfig = {
            index: config.index,
            body: config.query,
            size: config.size,
            from: config.from,
          };

          if (config.esType) {
            searchConfig.type = config.esType;
          }

          if (config.scroll || msg.scroll) {
            searchConfig.scroll = "1m";
          }

          if (config.bulkSize) {
            searchConfig.bulkSize = config.bulkSize;
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

          searchConfig.size = 10;
          if (config.size) {
            searchConfig.size = config.size;
          }

          if (msg.size) {
            searchConfig.size = msg.size;
          }

          if (msg.from) {
            searchConfig.from = msg.from;
          }

          if (msg.bulkSize) {
            searchConfig.bulkSize = msg.bulkSize;
          }

          msg.payload = [];
          if (config.fullResponse) {
            msg.es_responses = [];
          }

          serverConfig.client.search(searchConfig).then(
            function (resp) {
              (function next(resp) {
                if (config.fullResponse) {
                  msg.es_responses.push(resp);
                }

                if (!resp.hits || !resp.hits.hits || !resp.hits.hits.length) {
                  node.send(msg);
                  return;
                } else {
                  for (var i in resp.hits.hits) {
                    var obj = resp.hits.hits[i]._source;
                    obj._id = resp.hits.hits[i]._id;
                    msg.payload.push(obj);
                    if (msg.payload.length % searchConfig.bulkSize == 0) {
                      node.send(msg);
                      msg.payload = [];
                    }
                  }

                  if (!searchConfig.scroll) {
                    node.send(msg);
                    return;
                  }
                }

                if (searchConfig.scroll) {
                  var scrollId = resp._scroll_id;
                  // issue the next request
                  serverConfig.client
                    .scroll({
                      scroll: "1m",
                      scrollId: scrollId,
                    })
                    .then(next, (err) => node.error("Scroll error : " + err));
                }
              })(resp);
            },
            function (err) {
              node.error(err.message);
              msg.payload = [];
              msg.error = err;
              node.send(msg);
            }
          );
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
