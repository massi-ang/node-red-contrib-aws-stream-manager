// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

const {
    StreamManagerClient, MessageStreamDefinition, ExportDefinition
} = require('aws-greengrass-core-sdk/stream-manager');

module.exports = function(RED) {
	"use strict";

	function StreamManagerWriteNode(n) {
		RED.nodes.createNode(this,n);
        const node = this;
        node.stream = RED.nodes.getNode(n.stream);

        if (node.stream === undefined) {
            node.status({fill:"red",shape:"ring",text:"no stream configured"});
            node.error("no stream configured");
            return;
        }

        try {
        const c = new StreamManagerClient({
            onErrorCb: (err) => {
                node.status({fill:"red", shape: "ring", text:"no connection"});
                node.error(new Error(err));
                return;
            },
            onConnectCb: async () => {
                try {
                    // Let's start with something simple.
                    // Just print out all the available stream names on the server 
                   
			        // // Try deleting the stream (if it exists) so that we have a fresh start
                    // try {
                    //     await c.deleteMessageStream(node.streamName);
                    // } catch (e) {
                    //     // Rethrow the error if it wasn't the expected error
                    //     if (!(e instanceof ResourceNotFoundException)) {
                    //         node.error(new Error(e));
                    //     }
                    // }
                
                    try {
                        const messageStreamDef = new MessageStreamDefinition()
                        .withName(node.stream.streamName)
                        .withMaxSize(node.stream.maxSize || 268435456)
                        .withStreamSegmentSize(node.stream.streamSegmentSize || 16777216)
                        .withStrategyOnFull(node.stream.strategyOnFull);
                        const exportDefinition = new ExportDefinition();
                        if (node.stream.exportKinesis) {
                         	exportDefinition.withKinesis([new KinesisConfig()
                         		.withIdentifier(`KinesisExport${node.stream.kinesisStreamName}`)
                         		.withKinesisStreamName(node.stream.kinesisStreamName)]);
                        }
                        messageStreamDef.withExportDefinition(exportDefinition);
                        await c.createMessageStream(messageStreamDef);
                        node.status({fill: "green", shape:"dot", text: node.stream.streamName});
                    } catch (e) {
                        if (e.toString() === "Error: the message stream already exists") {
                            node.status({"fill": "blue", shape: "dot", text: node.stream.streamName})
                        } else {
                            node.error(e);
                            return;
                        }
                    }
                    node.on("input", function (msg, send, done) {
                        try {
                            const payload = Buffer.from(msg.payload);
                            c.appendMessage(node.stream.streamName, payload)

                            .then((resp) =>  {
                                msg.payload = resp;
                                send([msg, null]);
                            })
                            .catch((err) => { 
                                send([null, new Error(err)]);
                                done(err);
                            });
                        } catch (e) {
                            done(e);
                            return;
                        }
                    });

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

        
	RED.nodes.registerType("stream-write", StreamManagerWriteNode);
};