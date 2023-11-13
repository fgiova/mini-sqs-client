# mini sqs client using undici

[![NPM version](https://img.shields.io/npm/v/@fgiova/mini-sqs-client.svg?style=flat)](https://www.npmjs.com/package/@fgiova/mini-sqs-client)
![CI workflow](https://github.com/fgiova/mini-sqs-client/actions/workflows/node.js.yml/badge.svg)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Description
This module allows minimal set of SQS service functions using the aws-json protocol with "undici" as http agent.<br />
The @fgiova/aws-signature module is used for signing requests to optimize performance. <br />

Are supported:
- sending messages
- receiving messages
- deleting messages
- changing message visibility

## Installation
```bash
npm install @fgiova/mini-sqs-client
```
## Usage

```typescript
import {MiniSQSClient} from '@fgiova/mini-sqs-client'
import console = require("console");

const client = new MiniSQSClient("arn:aws:sqs:eu-central-1:000000000000:test");

await client.sendMessage({
	MessageBody: "Hello world",
	MessageAttributes: {
		"my-attribute": {
			DataType: "String",
			StringValue: "my-value"
		}
	}
});

const messages = await client.receiveMessage({
	WaitTimeSeconds: 20,
	MaxNumberOfMessages: 1,
	MessageAttributeNames: ["my-attribute"]
});

const message = messages[0];

await client.changeMessageVisibility({
	ReceiptHandle: message.ReceiptHandle,
	VisibilityTimeout: 10
});

console.log(message.Body);

await client.deleteMessage(message.ReceiptHandle);
```

## API

```typescript
MiniSQSClient(queueARN: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions)
MiniSQSClient.sendMessage(message: SendMessage): Promise<SendMessageResult>
MiniSQSClient.sendMessageBatch(messages: SendMessage[]): Promise<SendMessageBatchResult>
MiniSQSClient.receiveMessage(options: ReceiveMessage): Promise<ReceiveMessageResult>
MiniSQSClient.deleteMessage(receiptHandle: string): Promise<boolean>
MiniSQSClient.deleteMessageBatch(receiptHandles: string[]): Promise<boolean>
MiniSQSClient.changeMessageVisibility(receiptHandle: string, visibilityTimeout: number): Promise<boolean>
MiniSQSClient.changeMessageVisibilityBatch(receiptHandles: string[], visibilityTimeout: number): Promise<boolean>
```

All types are defined in [schemas.ts](./src/schemas.ts) and are derived from the [AWS SQS API](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_Operations.html) <br />
The main difference is that batch operations are not limited to 10 items, but accept any number of items and provide for running the batches needed to exhaust the total number of items.

## License
Licensed under [MIT](./LICENSE).
