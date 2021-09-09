// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

const {
    StreamManagerClient, ReadMessagesOptions
} = require('aws-greengrass-core-sdk/stream-manager');

module.exports = function(RED) {
	"use strict";

	function StreamManagerReadNode(n) {
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
                    
                    node.status({fill: "green", shape:"dot", text: node.stream.streamName});
                    
                    node.on("input", function (msg, send, done) {
                        const desiredStartSequenceNumber = msg.desiredStartSequenceNumber || msg.nextSequenceNumber || 0;
                        c.readMessages(node.stream.streamName, new ReadMessagesOptions(desiredStartSequenceNumber, 
                            msg.minMessageCount || 1, msg.maxMessageCount || 10, msg.readTimeoutMillis || 1000) )
                            .then((resp) =>  {
                                const maxSeq = resp[resp.length-1].sequenceNumber;
                                var msgs = resp.map(m => { 
                                    var c_msg = RED.util.cloneMessage(msg); 
                                    c_msg.metadata = m.asMap(); 
                                    c_msg.payload = c_msg.metadata.payload;
                                    delete c_msg.metadata.payload;
                                    return c_msg;
                                }) 
                                const lastMsg = {
                                    nextSequenceNumber: maxSeq+1,
                                    eos: false
                                }
                                send([msgs, [lastMsg], [null]]);
                                
                                done();
                            })
                            .catch((err) => { 
                                if (err.toString() === "Error: not enough messages to return before time out") {
                                    const lastMsg = {
                                        nextSequenceNumber: desiredStartSequenceNumber,
                                        eos: true,
                                    }
                                    send([[lastMsg], [lastMsg], [null]]);
                                    done();
                                    return;
                                }
                                send([[null], [null], [new Error(err)]]);
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

        
	RED.nodes.registerType("stream-read", StreamManagerReadNode);
};