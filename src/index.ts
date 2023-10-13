import {Signer, SignerOptions, HttpRequest} from "@fgiova/aws-signature";
import {Client, Pool} from "undici";
import {randomUUID, UUID} from "crypto";
import type {
	ReceiveMessage,
	ReceiveMessageResult,
	SendMessage,
	SendMessageBatchItem,
	SendMessageBatchResult, SendMessageResult, SQSTarget
} from "./schemas";

export class MiniSQSClient {
	private readonly queueSettings: {
		region: string,
		accountId: string,
		queueName: string,
		host: string,
		endpoint: string
	};
	private readonly pool: Pool;
	private readonly undiciOptions: Pool.Options;
	private readonly signer: Signer;
	constructor (queueARN: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions) {
		this.undiciOptions = undiciOptions;
		this.queueSettings = this.getQueueARN(queueARN, endpoint);
		this.pool = new Pool(this.queueSettings.endpoint, undiciOptions);
		if (signer instanceof Signer) {
			this.signer = signer;
		}
		else if (signer) {
			this.signer = new Signer(signer);
		}
		else {
			this.signer = new Signer();
		}
	}

	async destroy () {
		return Promise.all([
			this.pool.destroy(),
			this.signer.destroy()
		]);
	}

	private getQueueARN (queueARN: string, endpoint?: string) {
		const [queueName, accountId, region] = queueARN.split(":").reverse();
		endpoint = endpoint ?? `https://sqs.${region}.amazonaws.com`;
		const url = new URL(endpoint);
		return {
			region,
			accountId,
			queueName,
			host: url.host,
			endpoint
		}
	}
	private async SQSRequest<B,R>(body: B, target: SQSTarget, JSONResponse= true) {
		const {region, accountId, queueName, host} = this.queueSettings;
		const requestBody = JSON.stringify({
			...body
		});
		const requestData: HttpRequest = await this.signer.request({
			method: "POST",
			path: `/${accountId}/${queueName}/`,
			headers: {
				"X-Amz-Target": `AmazonSQS.${target}`,
				"Host": host,
			},
			body: requestBody
		}, "sqs", region);

		const response = await this.pool.request({
			path: `/${accountId}/${queueName}/`,
			method: requestData.method,
			headers: {
				"Content-Type": "application/x-amz-json-1.0",
				"Content-length": Buffer.byteLength(requestBody).toString(),
				...requestData.headers
			},
			body: requestBody
		});
		if(response.statusCode !== 200){
			let message = await response.body.text();
			try {
				const parsedBody = JSON.parse(message);
				if(parsedBody.message){
					message = parsedBody.message;
				}
			}
			catch (e) {
				// do nothing
			}
			throw Error(message);
		}
		return (JSONResponse ? await response.body.json() : true) as R;
	}

	private splitArrayMessages (messages: any[], maxItems = 10){
		return messages.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index/10);
			if(!item.Id) item.Id = randomUUID();
			if(!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = []; // start a new chunk
			}
			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);
	}

	async sendMessage (message: SendMessage) {
		return this.SQSRequest<SendMessage, SendMessageResult>(message, "SendMessage");
	}

	async sendMessageBatch (messages: SendMessageBatchItem[]) {
		if(!Array.isArray(messages)){
			throw new Error("messages must be an array");
		}
		const messagesChunks = this.splitArrayMessages(messages);
		const responses = {} as SendMessageBatchResult;
		for(const messagesChunk of messagesChunks){
			const responseChunk = await this.SQSRequest<{Entries:SendMessageBatchItem[]}, SendMessageBatchResult>({
				Entries: messagesChunk
			}, "SendMessageBatch");
			if(responseChunk.Failed ) {
				if(!responses.Failed) responses.Failed = [];
				responses.Failed.push(...responseChunk.Failed);
			}
			if (responseChunk.Successful) {
				if(!responses.Successful) responses.Successful = [];
				responses.Successful.push(...responseChunk.Successful);
			}
		}
		return responses;
	}

	async deleteMessage (receiptHandle: string) {
		await this.SQSRequest<{ReceiptHandle:string}, boolean>({
			ReceiptHandle: receiptHandle
		}, "DeleteMessage", false);
		return true;
	}

	async deleteMessageBatch (receiptHandles: string[]) {
		if(!Array.isArray(receiptHandles)){
			throw new Error("receiptHandles must be an array");
		}
		const receiptHandlesData = receiptHandles.map((receiptHandle) => ({
			Id: randomUUID(),
			ReceiptHandle: receiptHandle
		}));
		try {
			await this.SQSRequest<{
				Entries: { Id: UUID, ReceiptHandle: string }[]
			}, boolean>({
				Entries: receiptHandlesData
			}, "DeleteMessageBatch", false);
		}
		catch (e) {
			throw new Error(`Error ${e.message}\n Deleting messages: ${JSON.stringify(receiptHandlesData)}`);
		}
		return true;
	}

	async receiveMessage (receiveMessage: ReceiveMessage, clientClass = Client) {
		const {region, accountId, queueName, host, endpoint} = this.queueSettings;
		const receiveBody = JSON.stringify({
			...receiveMessage,
			WaitTimeSeconds: receiveMessage.WaitTimeSeconds > 20 ? 20 : receiveMessage.WaitTimeSeconds
		});
		const requestData: HttpRequest = await this.signer.request({
			method: "POST",
			path: `/${accountId}/${queueName}/`,
			headers: {
				"X-Amz-Target": "AmazonSQS.ReceiveMessage",
				"Host": host,
			},
			body: receiveBody
		}, "sqs", region);

		const timeout = receiveMessage.WaitTimeSeconds * 1000 + 1000;

		const client = new clientClass(endpoint, {
			...this.undiciOptions,
			connect: {
				...this.undiciOptions?.connect,
				timeout: timeout
			},
			bodyTimeout: timeout,
			keepAliveMaxTimeout: 21_000,
		});

		const response = await client.request({
			path: `/${accountId}/${queueName}/`,
			method: requestData.method,
			headers: {
				"Content-Type": "application/x-amz-json-1.0",
				"Content-length": Buffer.byteLength(receiveBody).toString(),
				...requestData.headers
			},
			body: receiveBody,
		});
		if(response.statusCode !== 200){
			throw Error(await response.body.text());
		}
		const responseData = await response.body.json() as ReceiveMessageResult;

		await client.close();
		return responseData;
	}

	async changeMessageVisibility (receiptHandle: string, visibilityTimeout: number) {
		await this.SQSRequest<{ReceiptHandle:string, VisibilityTimeout: number}, boolean>({
			ReceiptHandle: receiptHandle,
			VisibilityTimeout: visibilityTimeout
		}, "ChangeMessageVisibility", false);
		return true;
	}

	async changeMessageVisibilityBatch (receiptHandles: string[], visibilityTimeout: number) {
		if(!Array.isArray(receiptHandles)){
			throw new Error("receiptHandles must be an array");
		}
		await this.SQSRequest<{
			Entries: { Id: UUID, ReceiptHandle: string, VisibilityTimeout: number }[]
		}, boolean>({Entries: receiptHandles.map((receiptHandle) => ({
				Id: randomUUID(),
				ReceiptHandle: receiptHandle,
				VisibilityTimeout: visibilityTimeout
			}))}, "ChangeMessageVisibilityBatch", false);
		return true;
	}
}
export type * from "./schemas";
