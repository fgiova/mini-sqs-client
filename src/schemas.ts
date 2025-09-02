export type SQSTarget =
	| "SendMessage"
	| "SendMessageBatch"
	| "DeleteMessage"
	| "DeleteMessageBatch"
	| "ReceiveMessage"
	| "ChangeMessageVisibility"
	| "ChangeMessageVisibilityBatch";

export const QueueAttributeName = {
	All: "All",
	ApproximateNumberOfMessages: "ApproximateNumberOfMessages",
	ApproximateNumberOfMessagesDelayed: "ApproximateNumberOfMessagesDelayed",
	ApproximateNumberOfMessagesNotVisible:
		"ApproximateNumberOfMessagesNotVisible",
	ContentBasedDeduplication: "ContentBasedDeduplication",
	CreatedTimestamp: "CreatedTimestamp",
	DeduplicationScope: "DeduplicationScope",
	DelaySeconds: "DelaySeconds",
	FifoQueue: "FifoQueue",
	FifoThroughputLimit: "FifoThroughputLimit",
	KmsDataKeyReusePeriodSeconds: "KmsDataKeyReusePeriodSeconds",
	KmsMasterKeyId: "KmsMasterKeyId",
	LastModifiedTimestamp: "LastModifiedTimestamp",
	MaximumMessageSize: "MaximumMessageSize",
	MessageRetentionPeriod: "MessageRetentionPeriod",
	Policy: "Policy",
	QueueArn: "QueueArn",
	ReceiveMessageWaitTimeSeconds: "ReceiveMessageWaitTimeSeconds",
	RedriveAllowPolicy: "RedriveAllowPolicy",
	RedrivePolicy: "RedrivePolicy",
	SqsManagedSseEnabled: "SqsManagedSseEnabled",
	VisibilityTimeout: "VisibilityTimeout",
} as const;

export type QueueAttributeName =
	(typeof QueueAttributeName)[keyof typeof QueueAttributeName];

export interface MessageAttributeValue {
	/**
	 * <p>Strings are Unicode with UTF-8 binary encoding. For a list of code values, see <a href="http://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters">ASCII Printable
	 *                 Characters</a>.</p>
	 */
	StringValue?: string;

	/**
	 * <p>Binary type attributes can store any binary data, such as compressed data, encrypted
	 *             data, or images.</p>
	 */
	BinaryValue?: Uint8Array;

	/**
	 * <p>Amazon SQS supports the following logical data types: <code>String</code>,
	 *                 <code>Number</code>, and <code>Binary</code>. For the <code>Number</code> data type,
	 *             you must use <code>StringValue</code>.</p>
	 *          <p>You can also append custom labels. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html#sqs-message-attributes">Amazon SQS Message Attributes</a> in the <i>Amazon SQS Developer
	 *             Guide</i>.</p>
	 */
	DataType: "String" | "Number" | "Binary";
}
export interface Message {
	/**
	 * <p>A unique identifier for the message. A <code>MessageId</code>is considered unique
	 *             across all Amazon Web Services accounts for an extended period of time.</p>
	 */
	MessageId?: string;

	/**
	 * <p>An identifier associated with the act of receiving the message. A new receipt handle
	 *             is returned every time you receive a message. When deleting a message, you provide the
	 *             last received receipt handle to delete the message.</p>
	 */
	ReceiptHandle?: string;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message body string.</p>
	 */
	MD5OfBody?: string;

	/**
	 * <p>The message's contents (not URL-encoded).</p>
	 */
	Body?: string;

	/**
	 * <p>A map of the attributes requested in <code>
	 *                <a>ReceiveMessage</a>
	 *             </code> to
	 *             their respective values. Supported attributes:</p>
	 *          <ul>
	 *             <li>
	 *                <p>
	 *                   <code>ApproximateReceiveCount</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>ApproximateFirstReceiveTimestamp</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>MessageDeduplicationId</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>MessageGroupId</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SenderId</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SentTimestamp</code>
	 *                </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SequenceNumber</code>
	 *                </p>
	 *             </li>
	 *          </ul>
	 *          <p>
	 *             <code>ApproximateFirstReceiveTimestamp</code> and <code>SentTimestamp</code> are each
	 *             returned as an integer representing the <a href="http://en.wikipedia.org/wiki/Unix_time">epoch time</a> in
	 *             milliseconds.</p>
	 */
	Attributes?: Record<string, string>;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message attribute string. You can use this attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageAttributes?: string;

	/**
	 * <p>Each message attribute consists of a <code>Name</code>, <code>Type</code>,
	 * and <code>Value</code>. For more information, see
	 * <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html#sqs-message-attributes">Amazon SQS
	 * message attributes</a> in the <i>Amazon SQS Developer Guide</i>.</p>
	 */
	MessageAttributes?: Record<string, MessageAttributeValue>;
}

export interface MessageSystemAttributeValue {
	/**
	 * <p>Strings are Unicode with UTF-8 binary encoding. For a list of code values, see <a href="http://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters">ASCII Printable
	 *                 Characters</a>.</p>
	 */
	StringValue?: string;

	/**
	 * <p>Binary type attributes can store any binary data, such as compressed data, encrypted
	 *             data, or images.</p>
	 */
	BinaryValue?: Uint8Array;

	/**
	 * <p>Amazon SQS supports the following logical data types: <code>String</code>,
	 *                 <code>Number</code>, and <code>Binary</code>. For the <code>Number</code> data type,
	 *             you must use <code>StringValue</code>.</p>
	 *          <p>You can also append custom labels. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html#sqs-message-attributes">Amazon SQS Message Attributes</a> in the <i>Amazon SQS Developer
	 *             Guide</i>.</p>
	 */
	DataType: "String" | "Number" | "Binary";
}
export interface SendMessage {
	/**
	 * <p>The message to send. The minimum size is one character. The maximum size is 256
	 *             KiB.</p>
	 *          <important>
	 *             <p>A message can include only XML, JSON, and unformatted text. The following Unicode characters are allowed:</p>
	 *             <p>
	 *                <code>#x9</code> | <code>#xA</code> | <code>#xD</code> | <code>#x20</code> to <code>#xD7FF</code> | <code>#xE000</code> to <code>#xFFFD</code> | <code>#x10000</code> to <code>#x10FFFF</code>
	 *             </p>
	 *             <p>Any characters not included in this list will be rejected. For more information, see the <a href="http://www.w3.org/TR/REC-xml/#charsets">W3C specification for characters</a>.</p>
	 *          </important>
	 */
	MessageBody: string;

	/**
	 * <p> The length of time, in seconds, for which to delay a specific message. Valid values:
	 *             0 to 900. Maximum: 15 minutes. Messages with a positive <code>DelaySeconds</code> value
	 *             become available for processing after the delay period is finished. If you don't specify
	 *             a value, the default value for the queue applies. </p>
	 *          <note>
	 *             <p>When you set <code>FifoQueue</code>, you can't set <code>DelaySeconds</code> per message. You can set this parameter only on a queue level.</p>
	 *          </note>
	 */
	DelaySeconds?: number;

	/**
	 * <p>Each message attribute consists of a <code>Name</code>, <code>Type</code>,
	 * and <code>Value</code>. For more information, see
	 * <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html#sqs-message-attributes">Amazon SQS
	 * message attributes</a> in the <i>Amazon SQS Developer Guide</i>.</p>
	 */
	MessageAttributes?: Record<string, MessageAttributeValue>;

	/**
	 * <p>The message system attribute to send. Each message system attribute consists of a <code>Name</code>, <code>Type</code>, and <code>Value</code>.</p>
	 *          <important>
	 *             <ul>
	 *                <li>
	 *                   <p>Currently, the only supported message system attribute is <code>AWSTraceHeader</code>.
	 *                     Its type must be <code>String</code> and its value must be a correctly formatted
	 *                     X-Ray trace header string.</p>
	 *                </li>
	 *                <li>
	 *                   <p>The size of a message system attribute doesn't count towards the total size of a message.</p>
	 *                </li>
	 *             </ul>
	 *          </important>
	 */
	MessageSystemAttributes?: Record<string, MessageSystemAttributeValue>;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The token used for deduplication of sent messages. If a message with a particular
	 *                 <code>MessageDeduplicationId</code> is sent successfully, any messages sent with the
	 *             same <code>MessageDeduplicationId</code> are accepted successfully but aren't delivered
	 *             during the 5-minute deduplication interval. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html"> Exactly-once processing</a> in the <i>Amazon SQS Developer
	 *             Guide</i>.</p>
	 *          <ul>
	 *             <li>
	 *                <p>Every message must have a unique <code>MessageDeduplicationId</code>,</p>
	 *                <ul>
	 *                   <li>
	 *                      <p>You may provide a <code>MessageDeduplicationId</code>
	 *                             explicitly.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you aren't able to provide a <code>MessageDeduplicationId</code>
	 *                             and you enable <code>ContentBasedDeduplication</code> for your queue,
	 *                             Amazon SQS uses a SHA-256 hash to generate the
	 *                                 <code>MessageDeduplicationId</code> using the body of the message
	 *                             (but not the attributes of the message). </p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you don't provide a <code>MessageDeduplicationId</code> and the
	 *                             queue doesn't have <code>ContentBasedDeduplication</code> set, the
	 *                             action fails with an error.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If the queue has <code>ContentBasedDeduplication</code> set, your
	 *                                 <code>MessageDeduplicationId</code> overrides the generated
	 *                             one.</p>
	 *                   </li>
	 *                </ul>
	 *             </li>
	 *             <li>
	 *                <p>When <code>ContentBasedDeduplication</code> is in effect, messages with
	 *                     identical content sent within the deduplication interval are treated as
	 *                     duplicates and only one copy of the message is delivered.</p>
	 *             </li>
	 *             <li>
	 *                <p>If you send one message with <code>ContentBasedDeduplication</code> enabled
	 *                     and then another message with a <code>MessageDeduplicationId</code> that is the
	 *                     same as the one generated for the first <code>MessageDeduplicationId</code>, the
	 *                     two messages are treated as duplicates and only one copy of the message is
	 *                     delivered. </p>
	 *             </li>
	 *          </ul>
	 *          <note>
	 *             <p>The <code>MessageDeduplicationId</code> is available to the consumer of the
	 *                 message (this can be useful for troubleshooting delivery issues).</p>
	 *             <p>If a message is sent successfully but the acknowledgement is lost and the message
	 *                 is resent with the same <code>MessageDeduplicationId</code> after the deduplication
	 *                 interval, Amazon SQS can't detect duplicate messages.</p>
	 *             <p>Amazon SQS continues to keep track of the message deduplication ID even after the message is received and deleted.</p>
	 *          </note>
	 *          <p>The maximum length of <code>MessageDeduplicationId</code> is 128 characters.
	 *                 <code>MessageDeduplicationId</code> can contain alphanumeric characters
	 *                 (<code>a-z</code>, <code>A-Z</code>, <code>0-9</code>) and punctuation
	 *                 (<code>!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~</code>).</p>
	 *          <p>For best practices of using <code>MessageDeduplicationId</code>, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagededuplicationid-property.html">Using the MessageDeduplicationId Property</a> in the <i>Amazon SQS Developer
	 *                 Guide</i>.</p>
	 */
	MessageDeduplicationId?: string;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The tag that specifies that a message belongs to a specific message group. Messages
	 *             that belong to the same message group are processed in a FIFO manner (however,
	 *             messages in different message groups might be processed out of order). To interleave
	 *             multiple ordered streams within a single queue, use <code>MessageGroupId</code> values
	 *             (for example, session data for multiple users). In this scenario, multiple consumers can
	 *             process the queue, but the session data of each user is processed in a FIFO
	 *             fashion.</p>
	 *          <ul>
	 *             <li>
	 *                <p>You must associate a non-empty <code>MessageGroupId</code> with a message. If
	 *                     you don't provide a <code>MessageGroupId</code>, the action fails.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>ReceiveMessage</code> might return messages with multiple
	 *                         <code>MessageGroupId</code> values. For each <code>MessageGroupId</code>,
	 *                     the messages are sorted by time sent. The caller can't specify a
	 *                         <code>MessageGroupId</code>.</p>
	 *             </li>
	 *          </ul>
	 *          <p>The length of <code>MessageGroupId</code> is 128 characters. Valid values:
	 *             alphanumeric characters and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 *          <p>For best practices of using <code>MessageGroupId</code>, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagegroupid-property.html">Using the MessageGroupId Property</a> in the <i>Amazon SQS Developer
	 *                 Guide</i>.</p>
	 *          <important>
	 *             <p>
	 *                <code>MessageGroupId</code> is required for FIFO queues. You can't use it for
	 *                 Standard queues.</p>
	 *          </important>
	 */
	MessageGroupId?: string;
}

export interface SendMessageResult {
	/**
	 * <p>An MD5 digest of the non-URL-encoded message body string. You can use this attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageBody?: string;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message attribute string. You can use this attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageAttributes?: string;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message system attribute string. You can use this
	 * attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest.</p>
	 */
	MD5OfMessageSystemAttributes?: string;

	/**
	 * <p>An attribute containing the <code>MessageId</code> of the message sent to the queue.
	 *             For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html">Queue and Message Identifiers</a> in the <i>Amazon SQS Developer
	 *                 Guide</i>. </p>
	 */
	MessageId?: string;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The large, non-consecutive number that Amazon SQS assigns to each message.</p>
	 *          <p>The length of <code>SequenceNumber</code> is 128 bits. <code>SequenceNumber</code>
	 *             continues to increase for a particular <code>MessageGroupId</code>.</p>
	 */
	SequenceNumber?: string;
}

export interface SendMessageBatchItem {
	/**
	 * <p>An identifier for a message in this batch used to communicate the result.</p>
	 *          <note>
	 *             <p>The <code>Id</code>s of a batch request need to be unique within a request.</p>
	 *             <p>This identifier can have up to 80 characters. The following characters are accepted: alphanumeric characters, hyphens(-), and underscores (_).</p>
	 *          </note>
	 */
	Id?: string;

	/**
	 * <p>The body of the message.</p>
	 */
	MessageBody: string;

	/**
	 * <p>The length of time, in seconds, for which a specific message is delayed. Valid values:
	 *             0 to 900. Maximum: 15 minutes. Messages with a positive <code>DelaySeconds</code> value
	 *             become available for processing after the delay period is finished. If you don't specify
	 *             a value, the default value for the queue is applied. </p>
	 *          <note>
	 *             <p>When you set <code>FifoQueue</code>, you can't set <code>DelaySeconds</code> per message. You can set this parameter only on a queue level.</p>
	 *          </note>
	 */
	DelaySeconds?: number;

	/**
	 * <p>Each message attribute consists of a <code>Name</code>, <code>Type</code>,
	 * and <code>Value</code>. For more information, see
	 * <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-metadata.html#sqs-message-attributes">Amazon SQS
	 * message attributes</a> in the <i>Amazon SQS Developer Guide</i>.</p>
	 */
	MessageAttributes?: Record<string, MessageAttributeValue>;

	/**
	 * <p>The message system attribute to send Each message system attribute consists of a <code>Name</code>, <code>Type</code>, and <code>Value</code>.</p>
	 *          <important>
	 *             <ul>
	 *                <li>
	 *                   <p>Currently, the only supported message system attribute is <code>AWSTraceHeader</code>.
	 *                     Its type must be <code>String</code> and its value must be a correctly formatted
	 *                     X-Ray trace header string.</p>
	 *                </li>
	 *                <li>
	 *                   <p>The size of a message system attribute doesn't count towards the total size of a message.</p>
	 *                </li>
	 *             </ul>
	 *          </important>
	 */
	MessageSystemAttributes?: Record<string, MessageSystemAttributeValue>;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The token used for deduplication of messages within a 5-minute minimum deduplication
	 *             interval. If a message with a particular <code>MessageDeduplicationId</code> is sent
	 *             successfully, subsequent messages with the same <code>MessageDeduplicationId</code> are
	 *             accepted successfully but aren't delivered. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html"> Exactly-once processing</a> in the <i>Amazon SQS Developer
	 *             Guide</i>.</p>
	 *          <ul>
	 *             <li>
	 *                <p>Every message must have a unique <code>MessageDeduplicationId</code>,</p>
	 *                <ul>
	 *                   <li>
	 *                      <p>You may provide a <code>MessageDeduplicationId</code>
	 *                             explicitly.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you aren't able to provide a <code>MessageDeduplicationId</code>
	 *                             and you enable <code>ContentBasedDeduplication</code> for your queue,
	 *                             Amazon SQS uses a SHA-256 hash to generate the
	 *                                 <code>MessageDeduplicationId</code> using the body of the message
	 *                             (but not the attributes of the message). </p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you don't provide a <code>MessageDeduplicationId</code> and the
	 *                             queue doesn't have <code>ContentBasedDeduplication</code> set, the
	 *                             action fails with an error.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If the queue has <code>ContentBasedDeduplication</code> set, your
	 *                                 <code>MessageDeduplicationId</code> overrides the generated
	 *                             one.</p>
	 *                   </li>
	 *                </ul>
	 *             </li>
	 *             <li>
	 *                <p>When <code>ContentBasedDeduplication</code> is in effect, messages with
	 *                     identical content sent within the deduplication interval are treated as
	 *                     duplicates and only one copy of the message is delivered.</p>
	 *             </li>
	 *             <li>
	 *                <p>If you send one message with <code>ContentBasedDeduplication</code> enabled
	 *                     and then another message with a <code>MessageDeduplicationId</code> that is the
	 *                     same as the one generated for the first <code>MessageDeduplicationId</code>, the
	 *                     two messages are treated as duplicates and only one copy of the message is
	 *                     delivered. </p>
	 *             </li>
	 *          </ul>
	 *          <note>
	 *             <p>The <code>MessageDeduplicationId</code> is available to the consumer of the
	 *                 message (this can be useful for troubleshooting delivery issues).</p>
	 *             <p>If a message is sent successfully but the acknowledgement is lost and the message
	 *                 is resent with the same <code>MessageDeduplicationId</code> after the deduplication
	 *                 interval, Amazon SQS can't detect duplicate messages.</p>
	 *             <p>Amazon SQS continues to keep track of the message deduplication ID even after the message is received and deleted.</p>
	 *          </note>
	 *          <p>The length of <code>MessageDeduplicationId</code> is 128 characters.
	 *                 <code>MessageDeduplicationId</code> can contain alphanumeric characters
	 *                 (<code>a-z</code>, <code>A-Z</code>, <code>0-9</code>) and punctuation
	 *                 (<code>!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~</code>).</p>
	 *          <p>For best practices of using <code>MessageDeduplicationId</code>, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagededuplicationid-property.html">Using the MessageDeduplicationId Property</a> in the <i>Amazon SQS Developer
	 *                 Guide</i>.</p>
	 */
	MessageDeduplicationId?: string;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The tag that specifies that a message belongs to a specific message group. Messages
	 *             that belong to the same message group are processed in a FIFO manner (however,
	 *             messages in different message groups might be processed out of order). To interleave
	 *             multiple ordered streams within a single queue, use <code>MessageGroupId</code> values
	 *             (for example, session data for multiple users). In this scenario, multiple consumers can
	 *             process the queue, but the session data of each user is processed in a FIFO
	 *             fashion.</p>
	 *          <ul>
	 *             <li>
	 *                <p>You must associate a non-empty <code>MessageGroupId</code> with a message. If
	 *                     you don't provide a <code>MessageGroupId</code>, the action fails.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>ReceiveMessage</code> might return messages with multiple
	 *                         <code>MessageGroupId</code> values. For each <code>MessageGroupId</code>,
	 *                     the messages are sorted by time sent. The caller can't specify a
	 *                         <code>MessageGroupId</code>.</p>
	 *             </li>
	 *          </ul>
	 *          <p>The length of <code>MessageGroupId</code> is 128 characters. Valid values:
	 *             alphanumeric characters and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 *          <p>For best practices of using <code>MessageGroupId</code>, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagegroupid-property.html">Using the MessageGroupId Property</a> in the <i>Amazon SQS Developer
	 *                 Guide</i>.</p>
	 *          <important>
	 *             <p>
	 *                <code>MessageGroupId</code> is required for FIFO queues. You can't use it for
	 *                 Standard queues.</p>
	 *          </important>
	 */
	MessageGroupId?: string;
}

export interface SendMessageBatchResultEntry {
	/**
	 * <p>An identifier for the message in this batch.</p>
	 */
	Id: string | undefined;

	/**
	 * <p>An identifier for the message.</p>
	 */
	MessageId: string | undefined;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message body string. You can use this attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageBody: string | undefined;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message attribute string. You can use this attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageAttributes?: string;

	/**
	 * <p>An MD5 digest of the non-URL-encoded message system attribute string. You can use this
	 * attribute to verify that Amazon SQS received the message correctly. Amazon SQS URL-decodes the message before creating the MD5 digest. For information about MD5, see <a href="https://www.ietf.org/rfc/rfc1321.txt">RFC1321</a>.</p>
	 */
	MD5OfMessageSystemAttributes?: string;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The large, non-consecutive number that Amazon SQS assigns to each message.</p>
	 *          <p>The length of <code>SequenceNumber</code> is 128 bits. As <code>SequenceNumber</code>
	 *             continues to increase for a particular <code>MessageGroupId</code>.</p>
	 */
	SequenceNumber?: string;
}
export interface BatchResultErrorEntry {
	/**
	 * <p>The <code>Id</code> of an entry in a batch request.</p>
	 */
	Id: string | undefined;

	/**
	 * <p>Specifies whether the error happened due to the caller of the batch API action.</p>
	 */
	SenderFault: boolean | undefined;

	/**
	 * <p>An error code representing why the action failed on this entry.</p>
	 */
	Code: string | undefined;

	/**
	 * <p>A message explaining why the action failed on this entry.</p>
	 */
	Message?: string;
}
export interface SendMessageBatchResult {
	/**
	 * <p>A list of <code>
	 *                <a>SendMessageBatchResultEntry</a>
	 *             </code> items.</p>
	 */
	Successful: SendMessageBatchResultEntry[] | undefined;

	/**
	 * <p>A list of <code>
	 *                <a>BatchResultErrorEntry</a>
	 *             </code> items with error
	 *             details about each message that can't be enqueued.</p>
	 */
	Failed: BatchResultErrorEntry[] | undefined;
}

export interface ReceiveMessage {
	/**
	 * <p>A list of attributes that need to be returned along with each message. These
	 *             attributes include:</p>
	 *          <ul>
	 *             <li>
	 *                <p>
	 *                   <code>All</code> – Returns all values.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>ApproximateFirstReceiveTimestamp</code> – Returns the time the
	 *                     message was first received from the queue (<a href="http://en.wikipedia.org/wiki/Unix_time">epoch time</a> in
	 *                     milliseconds).</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>ApproximateReceiveCount</code> – Returns the number of times a
	 *                     message has been received across all queues but not deleted.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>AWSTraceHeader</code> – Returns the X-Ray trace
	 *                     header string. </p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SenderId</code>
	 *                </p>
	 *                <ul>
	 *                   <li>
	 *                      <p>For a user, returns the user ID, for example
	 *                                 <code>ABCDEFGHI1JKLMNOPQ23R</code>.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>For an IAM role, returns the IAM role ID, for example
	 *                                 <code>ABCDE1F2GH3I4JK5LMNOP:i-a123b456</code>.</p>
	 *                   </li>
	 *                </ul>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SentTimestamp</code> – Returns the time the message was sent to the
	 *                     queue (<a href="http://en.wikipedia.org/wiki/Unix_time">epoch time</a> in
	 *                     milliseconds).</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SqsManagedSseEnabled</code> – Enables server-side queue encryption
	 *                     using SQS owned encryption keys. Only one server-side encryption option is
	 *                     supported per queue (for example, <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-sse-existing-queue.html">SSE-KMS</a> or <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-sqs-sse-queue.html">SSE-SQS</a>).</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>MessageDeduplicationId</code> – Returns the value provided by the
	 *                     producer that calls the <code>
	 *                      <a>SendMessage</a>
	 *                   </code>
	 *                     action.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>MessageGroupId</code> – Returns the value provided by the
	 *                     producer that calls the <code>
	 *                      <a>SendMessage</a>
	 *                   </code> action.
	 *                     Messages with the same <code>MessageGroupId</code> are returned in
	 *                     sequence.</p>
	 *             </li>
	 *             <li>
	 *                <p>
	 *                   <code>SequenceNumber</code> – Returns the value provided by
	 *                     Amazon SQS.</p>
	 *             </li>
	 *          </ul>
	 */
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	AttributeNames?: (QueueAttributeName | string)[];

	/**
	 * <p>The name of the message attribute, where <i>N</i> is the index.</p>
	 *          <ul>
	 *             <li>
	 *                <p>The name can contain alphanumeric characters and the underscore
	 *                         (<code>_</code>), hyphen (<code>-</code>), and period
	 *                     (<code>.</code>).</p>
	 *             </li>
	 *             <li>
	 *                <p>The name is case-sensitive and must be unique among all attribute names for
	 *                     the message.</p>
	 *             </li>
	 *             <li>
	 *                <p>The name must not start with AWS-reserved prefixes such as <code>AWS.</code>
	 *                     or <code>Amazon.</code> (or any casing variants).</p>
	 *             </li>
	 *             <li>
	 *                <p>The name must not start or end with a period (<code>.</code>), and it should
	 *                     not have periods in succession (<code>..</code>).</p>
	 *             </li>
	 *             <li>
	 *                <p>The name can be up to 256 characters long.</p>
	 *             </li>
	 *          </ul>
	 *          <p>When using <code>ReceiveMessage</code>, you can send a list of attribute names to
	 *             receive, or you can return all of the attributes by specifying <code>All</code> or
	 *                 <code>.*</code> in your request. You can also use all message attributes starting
	 *             with a prefix, for example <code>bar.*</code>.</p>
	 */
	MessageAttributeNames?: string[];

	/**
	 * <p>The maximum number of messages to return. Amazon SQS never returns more messages than this
	 *             value (however, fewer messages might be returned). Valid values: 1 to 10. Default:
	 *             1.</p>
	 */
	MaxNumberOfMessages?: number;

	/**
	 * <p>The duration (in seconds) that the received messages are hidden from subsequent
	 *             retrieve requests after being retrieved by a <code>ReceiveMessage</code> request.</p>
	 */
	VisibilityTimeout?: number;

	/**
	 * <p>The duration (in seconds) for which the call waits for a message to arrive in the
	 *             queue before returning. If a message is available, the call returns sooner than
	 *                 <code>WaitTimeSeconds</code>. If no messages are available and the wait time
	 *             expires, the call returns successfully with an empty list of messages.</p>
	 *          <important>
	 *             <p>To avoid HTTP errors, ensure that the HTTP response timeout for
	 *                     <code>ReceiveMessage</code> requests is longer than the
	 *                     <code>WaitTimeSeconds</code> parameter. For example, with the Java SDK, you can
	 *                 set HTTP transport settings using the <a href="https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/http/nio/netty/NettyNioAsyncHttpClient.html"> NettyNioAsyncHttpClient</a> for asynchronous clients, or the <a href="https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/http/apache/ApacheHttpClient.html"> ApacheHttpClient</a> for synchronous clients. </p>
	 *          </important>
	 */
	WaitTimeSeconds?: number;

	/**
	 * <p>This parameter applies only to FIFO (first-in-first-out) queues.</p>
	 *          <p>The token used for deduplication of <code>ReceiveMessage</code> calls. If a networking
	 *             issue occurs after a <code>ReceiveMessage</code> action, and instead of a response you
	 *             receive a generic error, it is possible to retry the same action with an identical
	 *                 <code>ReceiveRequestAttemptId</code> to retrieve the same set of messages, even if
	 *             their visibility timeout has not yet expired.</p>
	 *          <ul>
	 *             <li>
	 *                <p>You can use <code>ReceiveRequestAttemptId</code> only for 5 minutes after a
	 *                         <code>ReceiveMessage</code> action.</p>
	 *             </li>
	 *             <li>
	 *                <p>When you set <code>FifoQueue</code>, a caller of the
	 *                         <code>ReceiveMessage</code> action can provide a
	 *                         <code>ReceiveRequestAttemptId</code> explicitly.</p>
	 *             </li>
	 *             <li>
	 *                <p>If a caller of the <code>ReceiveMessage</code> action doesn't provide a
	 *                         <code>ReceiveRequestAttemptId</code>, Amazon SQS generates a
	 *                         <code>ReceiveRequestAttemptId</code>.</p>
	 *             </li>
	 *             <li>
	 *                <p>It is possible to retry the <code>ReceiveMessage</code> action with the same
	 *                         <code>ReceiveRequestAttemptId</code> if none of the messages have been
	 *                     modified (deleted or had their visibility changes).</p>
	 *             </li>
	 *             <li>
	 *                <p>During a visibility timeout, subsequent calls with the same
	 *                         <code>ReceiveRequestAttemptId</code> return the same messages and receipt
	 *                     handles. If a retry occurs within the deduplication interval, it resets the
	 *                     visibility timeout. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html">Visibility Timeout</a> in the <i>Amazon SQS Developer
	 *                         Guide</i>.</p>
	 *                <important>
	 *                   <p>If a caller of the <code>ReceiveMessage</code> action still processes
	 *                         messages when the visibility timeout expires and messages become visible,
	 *                         another worker consuming from the same queue can receive the same messages
	 *                         and therefore process duplicates. Also, if a consumer whose message
	 *                         processing time is longer than the visibility timeout tries to delete the
	 *                         processed messages, the action fails with an error.</p>
	 *                   <p>To mitigate this effect, ensure that your application observes a safe
	 *                         threshold before the visibility timeout expires and extend the visibility
	 *                         timeout as necessary.</p>
	 *                </important>
	 *             </li>
	 *             <li>
	 *                <p>While messages with a particular <code>MessageGroupId</code> are invisible, no
	 *                     more messages belonging to the same <code>MessageGroupId</code> are returned
	 *                     until the visibility timeout expires. You can still receive messages with
	 *                     another <code>MessageGroupId</code> as long as it is also visible.</p>
	 *             </li>
	 *             <li>
	 *                <p>If a caller of <code>ReceiveMessage</code> can't track the
	 *                         <code>ReceiveRequestAttemptId</code>, no retries work until the original
	 *                     visibility timeout expires. As a result, delays might occur but the messages in
	 *                     the queue remain in a strict order.</p>
	 *             </li>
	 *          </ul>
	 *          <p>The maximum length of <code>ReceiveRequestAttemptId</code> is 128 characters.
	 *                 <code>ReceiveRequestAttemptId</code> can contain alphanumeric characters
	 *                 (<code>a-z</code>, <code>A-Z</code>, <code>0-9</code>) and punctuation
	 *                 (<code>!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~</code>).</p>
	 *          <p>For best practices of using <code>ReceiveRequestAttemptId</code>, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-receiverequestattemptid-request-parameter.html">Using the ReceiveRequestAttemptId Request Parameter</a> in the <i>Amazon SQS
	 *                 Developer Guide</i>.</p>
	 */
	ReceiveRequestAttemptId?: string;
}

export interface ReceiveMessageResult {
	/**
	 * <p>A list of messages.</p>
	 */
	Messages?: Message[];
}
