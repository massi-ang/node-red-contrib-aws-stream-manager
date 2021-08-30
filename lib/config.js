// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

module.exports = function(RED) {
	"use strict";

	function StreamManagerConfigNode(n) {
		RED.nodes.createNode(this,n);
        this.streamName = n.streamName;
        this.maxSize = n.maxSize;
    }
	RED.nodes.registerType("stream-config", StreamManagerConfigNode);
};