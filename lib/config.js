// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

const {
    StrategyOnFull
} = require('aws-greengrass-core-sdk/stream-manager');

module.exports = function(RED) {
	"use strict";

	function StreamManagerConfigNode(n) {
		RED.nodes.createNode(this,n);
        this.streamName = n.streamName;
        this.maxSize = Number(n.maxSize);
		this.flushOnWrite = Boolean(n.flushOnWrite);
        this.streamSegmentSize =  Number(n.streamSegmentSize);
	
		this.strategyOnFull = (n.strategyOnFull === "RejectNewData") ? StrategyOnFull.RejectNewData : StrategyOnFull.OverwriteOldestData;
    }
	RED.nodes.registerType("stream-config", StreamManagerConfigNode);
};