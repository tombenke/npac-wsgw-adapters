'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getTopicArray = function getTopicArray(topicList) {
    return _lodash2.default.isUndefined(topicList) || !_lodash2.default.isString(topicList) ? [] : topicList === "" ? [] : _lodash2.default.map(topicList.split(','), function (t) {
        return t.trim();
    });
};

/**
 * The default configuration for the wsServer adapter
 */
module.exports = {
    wsPdmsGw: {
        topics: {
            // The list of inbound NATS topic names
            inbound: getTopicArray(process.env.WSPDMSGW_INBOUND_TOPICS),

            // The list of outbound NATS topic names
            outbound: getTopicArray(process.env.WSPDMSGW_INBOUND_TOPICS)
        }
    }
};