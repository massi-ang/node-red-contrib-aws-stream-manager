// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT



module.exports = function(RED) {
	"use strict";

	function StreamManagerConfigNode(n) {
		RED.nodes.createNode(this,n);
		const node = this;
        this.streamName = n.streamName;
        this.maxSize = b.maxSize;

		

    }
	RED.nodes.registerType("stream-config", StreamManagerConfigNode);
};