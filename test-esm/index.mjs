import { test } from "tap";
process.env.AWS_ACCESS_KEY_ID = "foo";
process.env.AWS_SECRET_ACCESS_KEY = "bar";
import {MiniSQSClient} from "../dist/esm-wrapper.mjs";
import {MockAgent, setGlobalDispatcher} from "undici";
import {createHash, randomUUID} from "crypto";

const queueARN = "arn:aws:sqs:eu-central-1:000000000000:test";

test("MiniSQSClient", { only: true }, async (t) => {
	t.beforeEach(async (t) => {
		const mockAgent = new MockAgent();
		setGlobalDispatcher(mockAgent);
		mockAgent.disableNetConnect();
		const mockPool = mockAgent.get("https://sqs.eu-central-1.amazonaws.com");
		const client = new MiniSQSClient("eu-central-1", undefined, {
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
		const message = {
			MessageBody: "Hello World!"
		};
		const mockResponse = {
			MD5OfMessageBody: createHash("md5").update(JSON.stringify(message)).digest("hex"),
			MessageId: randomUUID()
		}
		mockPool.intercept({
			path: "/000000000000/test/",
			method: "POST",
			body: JSON.stringify(message),
			headers: (headers) => {
				return headers["x-amz-target"] === "AmazonSQS.SendMessage";
			}
		}).reply(200, mockResponse);
		const result = await client.sendMessage(queueARN, message);
		t.same(result, mockResponse);
	});
});