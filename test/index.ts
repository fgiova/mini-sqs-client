import { test } from "tap";
process.env.AWS_ACCESS_KEY_ID = "foo";
process.env.AWS_SECRET_ACCESS_KEY = "bar";
import {MiniSQSClient, SendMessage, SendMessageBatchItem, SendMessageBatchResult, SendMessageResult} from "../src";
import {Client, MockAgent, setGlobalDispatcher, MockClient} from "undici";
import {createHash, randomUUID} from "crypto";
import {Signer} from "@fgiova/aws-signature";

const queueARN = "arn:aws:sqs:eu-central-1:000000000000:test";

test("MiniSQSClient", { only: true }, async (t) => {
	t.beforeEach(async (t) => {
		const mockAgent = new MockAgent();
		setGlobalDispatcher(mockAgent);
		mockAgent.disableNetConnect();
		const mockPool = mockAgent.get("https://sqs.eu-central-1.amazonaws.com");
		const client = new MiniSQSClient(queueARN, undefined, {
			factory: () => mockPool
		});
		t.context = {
			mockPool,
			mockAgent,
			client
		}
	});
	t.afterEach(async (t) => {
		try{
			await t.context.mockPool.close();
			await t.context.mockAgent.close();
		} catch {
			// ignore
		}
	});

	await t.test("sendMessage", async (t) => {
		const { mockPool, client }  = t.context;
		const message: SendMessage = {
			MessageBody: "Hello World!"
		};
		const mockResponse: SendMessageResult = {
			MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
			MessageId: randomUUID()
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify(message),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessage";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessage(message);
		t.same(result, mockResponse);
	});

	await t.test("sendMessage Using signer instance", async (t) => {
		const { mockPool }  = t.context;
		const client = new MiniSQSClient(queueARN, undefined, {
			factory: () => mockPool
		}, new Signer());
		const message: SendMessage = {
			MessageBody: "Hello World!"
		};
		const mockResponse: SendMessageResult = {
			MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
			MessageId: randomUUID()
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify(message),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessage";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessage(message);
		t.same(result, mockResponse);
	});
	await t.test("sendMessage Using signer options", async (t) => {
		const { mockPool }  = t.context;
		const client = new MiniSQSClient(queueARN, undefined, {
			factory: () => mockPool
		}, {minThreads: 1, maxThreads: 1});
		const message: SendMessage = {
			MessageBody: "Hello World!"
		};
		const mockResponse: SendMessageResult = {
			MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
			MessageId: randomUUID()
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify(message),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessage";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessage(message);
		t.same(result, mockResponse);
	});
	await t.test("sendMessage and destroy client", async (t) => {
		const { mockPool }  = t.context;
		const client = new MiniSQSClient(queueARN, undefined, {
			factory: () => mockPool
		}, new Signer());
		const message: SendMessage = {
			MessageBody: "Hello World!"
		};
		const mockResponse: SendMessageResult = {
			MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
			MessageId: randomUUID()
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify(message),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessage";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessage(message);
		t.same(result, mockResponse);
		await t.resolves(client.destroy());
	});

	await t.test("sendMessageBatch", async (t) => {
		const { mockPool, client }  = t.context;
		const messages: SendMessageBatchItem[] = [
			{
				MessageBody: "Hello World 1!"
			},
			{
				MessageBody: "Hello World 2!"
			}
		];
		const mockResponse: SendMessageBatchResult = {} as SendMessageBatchResult;
		const MessageId = randomUUID();
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: (body: string) => {
				const Entries = JSON.parse(body).Entries;
				if(
					Entries[0].MessageBody === messages[0].MessageBody
					&&
					Entries[1].MessageBody === messages[1].MessageBody
				) {
					mockResponse.Successful = [
						{
							Id: Entries[0].Id,
							MD5OfMessageBody: createHash("md5").update(JSON.stringify(messages[0])).digest("hex"),
							MessageId,
						}
					];
					mockResponse.Failed = [{
							Id: Entries[1].Id,
							SenderFault: false,
							Code: "InternalError",
							Message: "An internal error occurred."
						}
					];

					return true
				}
				return false;
			},
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessageBatch";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessageBatch(messages);
		t.same(result, mockResponse);
	});

	await t.test("sendMessageBatch > 10", async (t) => {

		function splitArray (items: any[], maxItems = 10){
			return items.reduce((resultArray, item, index) => {
				const chunkIndex = Math.floor(index/10);
				if(!resultArray[chunkIndex]) {
					resultArray[chunkIndex] = []; // start a new chunk
				}
				resultArray[chunkIndex].push(item);

				return resultArray;
			}, []);
		}

		const { mockPool, client }  = t.context;
		const messages = [] as SendMessageBatchItem[];
		const mockResponse: SendMessageBatchResult = {
			Failed: [],
			Successful: []
		} as SendMessageBatchResult;
		for(let i = 0; i < 15; i++){
			const message: SendMessageBatchItem = {
				Id: randomUUID(),
				MessageBody: `Hello World ${i}!`
			}
			messages.push(message);
			mockResponse.Successful.push({
				Id: message.Id,
				MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
				MessageId: randomUUID()
			})
		}
		const messagesChunks = splitArray(messages);
		const responsesChunks = splitArray(mockResponse.Successful);
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify({ Entries: messagesChunks[0] }),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessageBatch";
			}
		}).reply(200, {
			Failed: [],
			Successful: responsesChunks[0]
		});
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify({ Entries: messagesChunks[1] }),
		}).reply(200, {
			Failed: [],
			Successful: responsesChunks[1]
		});
		const result = await client.sendMessageBatch(messages);
		t.same(result, mockResponse);
	});

	await t.test("deleteMessage", async (t) => {
		const { mockPool, client }  = t.context;
		const receiptHandle = randomUUID();
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify({
				ReceiptHandle: receiptHandle
			}),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.DeleteMessage";
			}
		}).reply(200, {});
		await t.resolves(client.deleteMessage(receiptHandle));
	});

	await t.test("deleteMessageBatch", async (t) => {
		const { mockPool, client }  = t.context;
		const receiptHandles: string[] = [];
		for (let i = 0; i < 15; i++) {
			receiptHandles.push(randomUUID());
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: (body: string) => {
				const Entries = JSON.parse(body).Entries as { Id: string, ReceiptHandle: string }[];
				const receiptHandlesData = Entries.filter(entry => receiptHandles.includes(entry.ReceiptHandle));
				return receiptHandlesData.length === receiptHandles.length;
			},
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.DeleteMessageBatch";
			}
		}).reply(200, {});
		await t.resolves(client.deleteMessageBatch(receiptHandles));
	});

	await t.test("receiveMessage", async (t) => {
		const { mockAgent, client }  = t.context;
		const messagesData = [
			{
				Body: "Hello World!",
				ReceiptHandle: randomUUID(),
				MessageId: randomUUID()
			}
		];
		class MockClientLocal extends MockClient{
			constructor(endpoint: string, options: Client.Options) {
				super(endpoint, {
					...options,
					agent: mockAgent
				});

				this.intercept({
					path: "/000000000000/test/",
					method: "POST",
					headers: (headers: Record<string, string>) => {
						return headers["x-amz-target"] === "AmazonSQS.ReceiveMessage";
					}
				})
				.reply(200, {
					Messages: messagesData
				});
			}
		}

		const messages = await client.receiveMessage({
			WaitTimeSeconds: 20
		}, MockClientLocal as any);
		t.same(messages, {
			Messages: messagesData
		});
	});
	await t.test("receiveMessage cap waitTime", async (t) => {
		const { mockAgent, client }  = t.context;
		const messagesData = [
			{
				Body: "Hello World!",
				ReceiptHandle: randomUUID(),
				MessageId: randomUUID()
			}
		];
		class MockClientLocal extends MockClient{
			constructor(endpoint: string, options: Client.Options) {
				super(endpoint, {
					...options,
					agent: mockAgent
				});

				this.intercept({
					path: "/000000000000/test/",
					method: "POST",
					headers: (headers: Record<string, string>) => {
						return headers["x-amz-target"] === "AmazonSQS.ReceiveMessage";
					},
					body: (body: string) => {
						const bodyData = JSON.parse(body);
						return bodyData.WaitTimeSeconds === 20;
					}
				})
					.reply(200, {
						Messages: messagesData
					});
			}
		}

		const messages = await client.receiveMessage({
			WaitTimeSeconds: 50
		}, MockClientLocal as any);
		t.same(messages, {
			Messages: messagesData
		});
	});

	await t.test("changeMessageVisibility", async (t) => {
		const { mockPool, client }  = t.context;
		const receiptHandle = randomUUID();
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify({
				ReceiptHandle: receiptHandle,
				VisibilityTimeout: 30
			}),
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.ChangeMessageVisibility";
			}
		}).reply(200, {});
		await t.resolves(client.changeMessageVisibility(receiptHandle, 30));
	});

	await t.test("changeMessageVisibilityBatch", async (t) => {
		const { mockPool, client }  = t.context;
		const receiptHandles: string[] = [];
		for (let i = 0; i < 15; i++) {
			receiptHandles.push(randomUUID());
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: (body: string) => {
				const Entries = JSON.parse(body).Entries as { Id: string, ReceiptHandle: string, VisibilityTimeout: number }[];
				const receiptHandlesData = Entries.filter(entry => {
					return receiptHandles.includes(entry.ReceiptHandle) && entry.VisibilityTimeout === 30;
				});
				return receiptHandlesData.length === receiptHandles.length ;
			},
			headers: (headers: Record<string, string>) => {
				return headers["x-amz-target"] === "AmazonSQS.ChangeMessageVisibilityBatch";
			}
		}).reply(200, {});
		await t.resolves(client.changeMessageVisibilityBatch(receiptHandles, 30));
	});
});