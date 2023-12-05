# mini sqs client using undici

[![NPM version](https://img.shields.io/npm/v/@fgiova/mini-sqs-client.svg?style=flat)](https://www.npmjs.com/package/@fgiova/mini-sqs-client)
![CI workflow](https://github.com/fgiova/mini-sqs-client/actions/workflows/node.js.yml/badge.svg)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Maintainability](https://api.codeclimate.com/v1/badges/0c10549e75ef6c798dfd/maintainability)](https://codeclimate.com/github/fgiova/mini-sqs-client/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0c10549e75ef6c798dfd/test_coverage)](https://codeclimate.com/github/fgiova/mini-sqs-client/test_coverage)

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

const client = new MiniSQSClient("eu-central-1");

await client.sendMessage("arn:aws:sqs:eu-central-1:000000000000:test", {
	MessageBody: "Hello world",
	MessageAttributes: {
		"my-attribute": {
			DataType: "String",
			StringValue: "my-value"
		}
	}
});

const messages = await client.receiveMessage("arn:aws:sqs:eu-central-1:000000000000:test", {
	WaitTimeSeconds: 20,
	MaxNumberOfMessages: 1,
	MessageAttributeNames: ["my-attribute"]
});

const message = messages[0];

await client.changeMessageVisibility("arn:aws:sqs:eu-central-1:000000000000:test", {
	ReceiptHandle: message.ReceiptHandle,
	VisibilityTimeout: 10
});

console.log(message.Body);

await client.deleteMessage("arn:aws:sqs:eu-central-1:000000000000:test", message.ReceiptHandle);
```

## API

```typescript
MiniSQSClient(region: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions)
MiniSQSClient.sendMessage(queueARN: string, message: SendMessage): Promise<SendMessageResult>
MiniSQSClient.sendMessageBatch(queueARN: string, messages: SendMessage[]): Promise<SendMessageBatchResult>
MiniSQSClient.receiveMessage(queueARN: string, options: ReceiveMessage): Promise<ReceiveMessageResult>
MiniSQSClient.deleteMessage(queueARN: string, receiptHandle: string): Promise<boolean>
MiniSQSClient.deleteMessageBatch(queueARN: string, receiptHandles: string[]): Promise<boolean>
MiniSQSClient.changeMessageVisibility(queueARN: string, receiptHandle: string, visibilityTimeout: number): Promise<boolean>
MiniSQSClient.changeMessageVisibilityBatch(queueARN: string, receiptHandles: string[], visibilityTimeout: number): Promise<boolean>
MiniSQSClient.destroy(signer: boolean): Promise<boolean> // signer destroyer default true
```

All types are defined in [schemas.ts](./src/schemas.ts) and are derived from the [AWS SQS API](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_Operations.html) <br />
The main difference is that batch operations are not limited to 10 items, but accept any number of items and provide for running the batches needed to exhaust the total number of items.

## License
Licensed under [MIT](./LICENSE).
