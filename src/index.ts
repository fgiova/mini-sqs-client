import { randomUUID, type UUID } from "node:crypto";
import {
	type HttpRequest,
	Signer,
	type SignerOptions,
	SignerSingleton,
} from "@fgiova/aws-signature";
import {
	Client,
	type Dispatcher,
	getGlobalDispatcher,
	MockAgent,
	Pool,
} from "undici";
import type {
	ReceiveMessage,
	ReceiveMessageResult,
	SendMessage,
	SendMessageBatchItem,
	SendMessageBatchResult,
	SendMessageResult,
	SQSTarget,
} from "./schemas";

export class MiniSQSClient {
	private readonly pool: Pool | Dispatcher;
	private readonly undiciOptions: Pool.Options;
	private readonly signer: Signer;
	private readonly region: string;
	private readonly endpoint: string;
	private defaultDestroySigner = true;
	private receiveMessageClientCache: Map<number, Client> = new Map();

	constructor(
		region: string,
		endpoint?: string,
		undiciOptions?: Pool.Options,
		signer?: Signer | SignerOptions,
	) {
		/* c8 ignore next 1 */
		this.undiciOptions = undiciOptions || {};
		this.region = region;
		this.endpoint = endpoint ?? `https://sqs.${region}.amazonaws.com`;
		const globalDispatcher = getGlobalDispatcher();
		this.pool =
			globalDispatcher instanceof MockAgent
				? (globalDispatcher as MockAgent).get(this.endpoint)
				: new Pool(this.endpoint, {
						...undiciOptions,
						clientTtl: 60 * 60 * 1000,
					});

		if (signer instanceof Signer) {
			this.signer = signer;
		} else if (signer) {
			this.signer = new Signer(signer);
		} else {
			this.defaultDestroySigner = false;
			this.signer = SignerSingleton.getSigner();
		}
	}

	async destroy(signer: boolean = this.defaultDestroySigner) {
		const result = await Promise.all([
			this.pool.destroy(),
			(signer && this.signer.destroy()) || true,
			...Array.from(this.receiveMessageClientCache.values()).map((client) =>
				client.destroy(),
			),
		]);
		this.receiveMessageClientCache.clear();
		return result;
	}

	private async readText(
		body: Dispatcher.ResponseData["body"],
	): Promise<string> {
		try {
			return await body.text();
		} catch (err) {
			try {
				await body.dump();
			} catch {}
			throw err;
		}
	}

	private async readJson<T>(body: Dispatcher.ResponseData["body"]): Promise<T> {
		try {
			return (await body.json()) as T;
		} catch (err) {
			try {
				await body.dump();
			} catch {}
			throw err;
		}
	}

	private getQueueARN(queueARN: string) {
		const [queueName, accountId, region] = queueARN.split(":").reverse();
		if (region !== this.region)
			throw new Error(`Region ${region} does not match ${this.region}`);
		const endpoint = this.endpoint;
		const url = new URL(endpoint);
		return {
			region,
			accountId,
			queueName,
			host: url.host,
			endpoint,
		};
	}

	private async SQSRequest<B, R>(
		body: B,
		target: SQSTarget,
		queueSettings: {
			region: string;
			accountId: string;
			queueName: string;
			host: string;
			endpoint: string;
		},
		JSONResponse = true,
	) {
		const { region, accountId, queueName, host } = queueSettings;
		const requestBody = JSON.stringify({
			...body,
		});
		const requestData: HttpRequest = await this.signer.request(
			{
				method: "POST",
				path: `/${accountId}/${queueName}/`,
				headers: {
					"X-Amz-Target": `AmazonSQS.${target}`,
					Host: host,
				},
				body: requestBody,
			},
			"sqs",
			region,
		);

		const response = await this.pool.request({
			path: `/${accountId}/${queueName}/`,
			method: requestData.method,
			headers: {
				"Content-Type": "application/x-amz-json-1.0",
				"Content-length": Buffer.byteLength(requestBody).toString(),
				...requestData.headers,
			},
			body: requestBody,
		});
		if (response.statusCode !== 200) {
			let message = await this.readText(response.body);
			try {
				const parsedBody = JSON.parse(message);
				if (parsedBody.message) {
					message = parsedBody.message;
				}
				// biome-ignore lint/correctness/noUnusedVariables: must be an empty catch
			} catch (e) {
				// do nothing
			}
			throw Error(message);
		}
		if (JSONResponse) {
			return await this.readJson<R>(response.body);
		}
		await response.body.dump();
		return true as R;
	}

	// biome-ignore lint/suspicious/noExplicitAny: messages can be any
	private splitArrayMessages(messages: any[], maxItems = 10) {
		return messages.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / maxItems);
			if (!item.Id) item.Id = randomUUID();
			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = []; // start a new chunk
			}
			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);
	}

	async sendMessage(queueARN: string, message: SendMessage) {
		const queueSettings = this.getQueueARN(queueARN);
		return this.SQSRequest<SendMessage, SendMessageResult>(
			message,
			"SendMessage",
			queueSettings,
		);
	}

	async sendMessageBatch(queueARN: string, messages: SendMessageBatchItem[]) {
		if (!Array.isArray(messages)) {
			throw new Error("messages must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		const messagesChunks = this.splitArrayMessages(messages);
		const responses = {} as SendMessageBatchResult;
		for (const messagesChunk of messagesChunks) {
			const responseChunk = await this.SQSRequest<
				{ Entries: SendMessageBatchItem[] },
				SendMessageBatchResult
			>(
				{
					Entries: messagesChunk,
				},
				"SendMessageBatch",
				queueSettings,
			);
			if (responseChunk.Failed) {
				if (!responses.Failed) responses.Failed = [];
				responses.Failed.push(...responseChunk.Failed);
			}
			if (responseChunk.Successful) {
				if (!responses.Successful) responses.Successful = [];
				responses.Successful.push(...responseChunk.Successful);
			}
		}
		return responses;
	}

	async deleteMessage(queueARN: string, receiptHandle: string) {
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<{ ReceiptHandle: string }, boolean>(
			{
				ReceiptHandle: receiptHandle,
			},
			"DeleteMessage",
			queueSettings,
			false,
		);
		return true;
	}

	async deleteMessageBatch(queueARN: string, receiptHandles: string[]) {
		if (!Array.isArray(receiptHandles)) {
			throw new Error("receiptHandles must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		const receiptHandlesData = receiptHandles.map((receiptHandle) => ({
			Id: randomUUID(),
			ReceiptHandle: receiptHandle,
		}));
		try {
			await this.SQSRequest<
				{
					Entries: { Id: UUID; ReceiptHandle: string }[];
				},
				boolean
			>(
				{
					Entries: receiptHandlesData,
				},
				"DeleteMessageBatch",
				queueSettings,
				false,
			);
			// biome-ignore lint/suspicious/noExplicitAny: error type is not important
		} catch (e: any) {
			throw new Error(
				`Error ${e.message}\n Deleting messages: ${JSON.stringify(receiptHandlesData)}`,
			);
		}
		return true;
	}

	private receiveMessageClient(timeout: number) {
		const globalDispatcher = getGlobalDispatcher();
		if (globalDispatcher instanceof MockAgent) {
			return (globalDispatcher as MockAgent).get(this.endpoint);
		}

		const cached = this.receiveMessageClientCache.get(timeout);
		if (cached) return cached;

		const client = new Client(this.endpoint, {
			...this.undiciOptions,
			connect: {
				...this.undiciOptions?.connect,
				timeout: timeout,
			},
			bodyTimeout: timeout,
			keepAliveMaxTimeout: 21_000,
		});
		this.receiveMessageClientCache.set(timeout, client);
		return client;
	}

	async receiveMessage(queueARN: string, receiveMessage: ReceiveMessage) {
		const { region, accountId, queueName, host } = this.getQueueARN(queueARN);
		receiveMessage.WaitTimeSeconds =
			Number(receiveMessage.WaitTimeSeconds) > 20 ||
			!receiveMessage.WaitTimeSeconds
				? 20
				: receiveMessage.WaitTimeSeconds;

		const receiveBody = JSON.stringify({
			...receiveMessage,
		});

		const requestData: HttpRequest = await this.signer.request(
			{
				method: "POST",
				path: `/${accountId}/${queueName}/`,
				headers: {
					"X-Amz-Target": "AmazonSQS.ReceiveMessage",
					Host: host,
				},
				body: receiveBody,
			},
			"sqs",
			region,
		);

		const timeout = receiveMessage.WaitTimeSeconds * 1000 + 1000;

		const client = this.receiveMessageClient(timeout);

		const response = await client.request({
			path: `/${accountId}/${queueName}/`,
			method: requestData.method,
			headers: {
				"Content-Type": "application/x-amz-json-1.0",
				"Content-length": Buffer.byteLength(receiveBody).toString(),
				...requestData.headers,
			},
			body: receiveBody,
			bodyTimeout: timeout,
		});

		if (response.statusCode !== 200) {
			throw Error(await this.readText(response.body));
		}
		return await this.readJson<ReceiveMessageResult>(response.body);
	}

	async changeMessageVisibility(
		queueARN: string,
		receiptHandle: string,
		visibilityTimeout: number,
	) {
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<
			{ ReceiptHandle: string; VisibilityTimeout: number },
			boolean
		>(
			{
				ReceiptHandle: receiptHandle,
				VisibilityTimeout: visibilityTimeout,
			},
			"ChangeMessageVisibility",
			queueSettings,
			false,
		);
		return true;
	}

	async changeMessageVisibilityBatch(
		queueARN: string,
		receiptHandles: string[],
		visibilityTimeout: number,
	) {
		if (!Array.isArray(receiptHandles)) {
			throw new Error("receiptHandles must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<
			{
				Entries: {
					Id: UUID;
					ReceiptHandle: string;
					VisibilityTimeout: number;
				}[];
			},
			boolean
		>(
			{
				Entries: receiptHandles.map((receiptHandle) => ({
					Id: randomUUID(),
					ReceiptHandle: receiptHandle,
					VisibilityTimeout: visibilityTimeout,
				})),
			},
			"ChangeMessageVisibilityBatch",
			queueSettings,
			false,
		);
		return true;
	}
}

export type * from "./schemas";
