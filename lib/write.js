// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

const {
    StreamManagerClient, MessageStreamDefinition
} = require('aws-greengrass-stream-manager-sdk');

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

        const c = new StreamManagerClient({
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
                        // const exports = new ExportDefinition()
                        // 	.withKinesis([new KinesisConfig()
                        // 		.withIdentifier(`KinesisExport${STREAM_NAME}`)
                        // 		.withKinesisStreamName(KINESIS_STREAM_NAME)]);
                
                        await c.createMessageStream(
                            new MessageStreamDefinition()
                                .withName(node.stream.streamName));
                        
                    } catch (e) {
                        node.warn(new Error(e));
                    }
                    node.status({fill: "green", shape:"dot", text: node.stream.streamName});
                    
                    node.on("input", function (msg, send, done) {
                        c.appendMessage(node.stream.streamName, msg.payload)

                            .then((resp) =>  {
                                msg.payload = resp;
                                send([msg, null]);
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
                    // c.close(); // Always close the client when you're done
                }
            }
        });
    }

        
	RED.nodes.registerType("stream-write", StreamManagerWriteNode);
};