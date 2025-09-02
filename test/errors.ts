import { test } from "tap";

process.env.AWS_ACCESS_KEY_ID = "foo";
process.env.AWS_SECRET_ACCESS_KEY = "bar";
process.env.AWS_REGION = "eu-central-1";

import { randomUUID } from "node:crypto";
import { type Client, MockAgent, MockClient } from "undici";
import { MiniSQSClient, type SendMessage } from "../src";

const queueARN = "arn:aws:sqs:eu-central-1:000000000000:test";

test("MiniSQSClient Errors", async (t) => {
	t.beforeEach(async (t) => {
		const mockAgent = new MockAgent();
		mockAgent.disableNetConnect();
		const mockPool = mockAgent.get("https://sqs.eu-central-1.amazonaws.com");
		const client = new MiniSQSClient("eu-central-1", undefined, {
			factory: () => mockPool,
		});
		t.context = {
			mockPool,
			mockAgent,
			client,
		};
	});
	t.afterEach(async (t) => {
		await t.context.mockPool.close();
		await t.context.mockAgent.close();
	});

	await t.test("sendMessage Error with json message", async (t) => {
		const { mockPool, client } = t.context;
		const message: SendMessage = {
			MessageBody: "Hello World!",
		};
		mockPool
			.intercept({
				path: "/000000000000/test/",
				method: "POST",
				body: JSON.stringify(message),
			})
			.reply(400, {
				message:
					"The request was rejected because the specified queue does not exist or you do not have access to it.",
			});
		await t.rejects(
			client.sendMessage(queueARN, message),
			Error(
				"The request was rejected because the specified queue does not exist or you do not have access to it.",
			),
		);
	});
	await t.test("sendMessage Error without json message", async (t) => {
		const { mockPool, client } = t.context;
		const message: SendMessage = {
			MessageBody: "Hello World!",
		};
		mockPool
			.intercept({
				path: "/000000000000/test/",
				method: "POST",
				body: JSON.stringify(message),
			})
			.reply(500, {
				error: "Generic Error",
			});
		await t.rejects(
			client.sendMessage(queueARN, message),
			Error(
				JSON.stringify({
					error: "Generic Error",
				}),
			),
		);
	});
	await t.test("sendMessage Error without json", async (t) => {
		const { mockPool, client } = t.context;
		const message: SendMessage = {
			MessageBody: "Hello World!",
		};
		mockPool
			.intercept({
				path: "/000000000000/test/",
				method: "POST",
				body: JSON.stringify(message),
			})
			.reply(500, "Generic Error");
		await t.rejects(
			client.sendMessage(queueARN, message),
			Error("Generic Error"),
		);
	});
	await t.test("sendMessage Error wrong region", async (t) => {
		const { client } = t.context;
		const message: SendMessage = {
			MessageBody: "Hello World!",
		};
		await t.rejects(
			client.sendMessage("arn:aws:sqs:eu-west-1:000000000000:test", message),
			Error("Region eu-west-1 does not match eu-central-1"),
		);
	});

	await t.test("sendMessageBatch Error", async (t) => {
		const { client } = t.context;
		await t.rejects(
			client.sendMessageBatch(queueARN, {}),
			Error("messages must be an array"),
		);
	});

	await t.test("deleteMessageBatch Error no array", async (t) => {
		const { client } = t.context;
		await t.rejects(
			client.deleteMessageBatch(queueARN, randomUUID()),
			"messages must be an array",
		);
	});

	await t.test("deleteMessageBatch Genreric Error", async (t) => {
		const { client, mockPool } = t.context;
		mockPool
			.intercept({
				path: "/000000000000/test/",
				method: "POST",
				headers: (headers: Record<string, string>) => {
					return headers["x-amz-target"] === "AmazonSQS.DeleteMessageBatch";
				},
			})
			.reply(500, "Generic Error");
		await t.rejects(client.deleteMessageBatch(queueARN, [randomUUID()]));
	});

	await t.test("receiveMessage Error", async (t) => {
		const { mockAgent, client } = t.context;
		class MockClientLocal extends MockClient {
			constructor(endpoint: string, options: Client.Options) {
				super(endpoint, {
					...options,
					agent: mockAgent,
				});

				this.intercept({
					path: "/000000000000/test/",
					method: "POST",
					headers: (headers: Record<string, string>) => {
						return headers["x-amz-target"] === "AmazonSQS.ReceiveMessage";
					},
				}).reply(500, "Generic Error");
			}
		}

		await t.rejects(
			client.receiveMessage(
				queueARN,
				{
					WaitTimeSeconds: 20,
				},
				MockClientLocal,
			),
		);
	});

	await t.test("changeMessageVisibilityBatch Error no array", async (t) => {
		const { client } = t.context;
		await t.rejects(
			client.changeMessageVisibilityBatch(queueARN, randomUUID(), 30),
			"messages must be an array",
		);
	});
});
