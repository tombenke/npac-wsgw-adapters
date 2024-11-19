import _ from 'lodash'

const getTopicArray = (topicList) =>
    _.isUndefined(topicList) || !_.isString(topicList)
        ? []
        : topicList === ''
          ? []
          : _.map(topicList.split(','), (t) => t.trim())

/**
 * The default configuration for the wsServer adapter
 */
module.exports = {
    wsServer: {
        topics: {
            // The list of inbound NATS topic names
            inbound: getTopicArray(process.env.WSGW_INBOUND_TOPICS),

            // The list of outbound NATS topic names
            outbound: getTopicArray(process.env.WSGW_OUTBOUND_TOPICS)
        }
    }
}
