// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

const {
    StreamManagerClient
} = require('aws-greengrass-core-sdk/stream-manager');

module.exports = function (RED) {
    "use strict";

    function StreamManagerDescribeNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        node.stream = RED.nodes.getNode(n.stream);

        if (node.stream === undefined) {
            node.status({ fill: "red", shape: "ring", text: "no stream configured" });
            node.error("no stream configured");
            return;
        }

        try {
            const c = new StreamManagerClient({
                onErrorCb: (err) => {
                    node.status({ fill: "red", shape: "ring", text: "no connection" });
                    node.error(new Error(err));
                    return;
                },
                onConnectCb: async () => {
                    try {

                        node.status({ fill: "green", shape: "dot", text: node.stream.streamName });

                        node.on("input", function (msg, send, done) {
                            c.describeMessageStream(node.stream.streamName)
                                .then((resp) => {
                                    msg.payload = resp.asMap();
                                    send([msg, null]);
                                    done();
                                })
                                .catch((err) => {
                                    send([null, new Error(err)]);
                                    done(err);
                                });
                        })

                        node.on("close", function (done) {
                            c.close();
                            done();
                        });


                    } catch (e) {
                        node.error(new Error(e))
                        c.close(); // Always close the client when you're done
                    }
                }
            });
        } catch (err) {
            node.error(new Error(err));
        }
    }


    RED.nodes.registerType("stream-describe", StreamManagerDescribeNode);
};