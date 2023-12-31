import {Signer, SignerSingleton, SignerOptions, HttpRequest} from "@fgiova/aws-signature";
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
	private readonly pool: Pool;
	private readonly undiciOptions: Pool.Options;
	private readonly signer: Signer;
	private region: string;
	private endpoint: string;
	private defaultDestroySigner = true;

	constructor (region: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions) {
		this.undiciOptions = undiciOptions;
		this.region = region;
		this.endpoint = endpoint ?? `https://sqs.${region}.amazonaws.com`;
		this.pool = new Pool(this.endpoint, undiciOptions);
		if (signer instanceof Signer) {
			this.signer = signer;
		}
		else if (signer) {
			this.signer = new Signer(signer);
		}
		else {
			this.defaultDestroySigner = false;
			this.signer = SignerSingleton.getSigner();
		}
	}

	async destroy (signer: boolean = this.defaultDestroySigner) {
		return Promise.all([
			this.pool.destroy(),
			signer && this.signer.destroy() || true
		]);
	}

	private getQueueARN (queueARN: string) {
		const [queueName, accountId, region] = queueARN.split(":").reverse();
		if (region !== this.region) throw new Error(`Region ${region} does not match ${this.region}`);
		const endpoint = this.endpoint;
		const url = new URL(endpoint);
		return {
			region,
			accountId,
			queueName,
			host: url.host,
			endpoint
		}
	}
	private async SQSRequest<B,R>(body: B, target: SQSTarget, queueSettings: {
		region: string,
		accountId: string,
		queueName: string,
		host: string,
		endpoint: string
	}, JSONResponse= true) {
		const {region, accountId, queueName, host} = queueSettings;
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

	async sendMessage (queueARN: string, message: SendMessage) {
		const queueSettings = this.getQueueARN(queueARN);
		return this.SQSRequest<SendMessage, SendMessageResult>(message, "SendMessage", queueSettings);
	}

	async sendMessageBatch (queueARN: string, messages: SendMessageBatchItem[]) {
		if(!Array.isArray(messages)){
			throw new Error("messages must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		const messagesChunks = this.splitArrayMessages(messages);
		const responses = {} as SendMessageBatchResult;
		for(const messagesChunk of messagesChunks){
			const responseChunk = await this.SQSRequest<{Entries:SendMessageBatchItem[]}, SendMessageBatchResult>({
				Entries: messagesChunk
			}, "SendMessageBatch", queueSettings);
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

	async deleteMessage (queueARN: string, receiptHandle: string) {
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<{ReceiptHandle:string}, boolean>({
			ReceiptHandle: receiptHandle
		}, "DeleteMessage", queueSettings, false);
		return true;
	}

	async deleteMessageBatch (queueARN: string, receiptHandles: string[]) {
		if(!Array.isArray(receiptHandles)){
			throw new Error("receiptHandles must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		const receiptHandlesData = receiptHandles.map((receiptHandle) => ({
			Id: randomUUID(),
			ReceiptHandle: receiptHandle
		}));
		try {
			await this.SQSRequest<{
				Entries: { Id: UUID, ReceiptHandle: string }[]
			}, boolean>({
				Entries: receiptHandlesData
			}, "DeleteMessageBatch", queueSettings,false);
		}
		catch (e) {
			throw new Error(`Error ${e.message}\n Deleting messages: ${JSON.stringify(receiptHandlesData)}`);
		}
		return true;
	}

	async receiveMessage (queueARN: string, receiveMessage: ReceiveMessage, clientClass = Client) {
		const {region, accountId, queueName, host, endpoint} = this.getQueueARN(queueARN);
		receiveMessage.WaitTimeSeconds = receiveMessage.WaitTimeSeconds > 20 || !receiveMessage.WaitTimeSeconds ? 20 : receiveMessage.WaitTimeSeconds;
		const receiveBody = JSON.stringify({
			...receiveMessage
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

	async changeMessageVisibility (queueARN: string, receiptHandle: string, visibilityTimeout: number) {
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<{ReceiptHandle:string, VisibilityTimeout: number}, boolean>({
			ReceiptHandle: receiptHandle,
			VisibilityTimeout: visibilityTimeout
		}, "ChangeMessageVisibility", queueSettings,false);
		return true;
	}

	async changeMessageVisibilityBatch (queueARN: string, receiptHandles: string[], visibilityTimeout: number) {
		if(!Array.isArray(receiptHandles)){
			throw new Error("receiptHandles must be an array");
		}
		const queueSettings = this.getQueueARN(queueARN);
		await this.SQSRequest<{
			Entries: { Id: UUID, ReceiptHandle: string, VisibilityTimeout: number }[]
		}, boolean>({Entries: receiptHandles.map((receiptHandle) => ({
				Id: randomUUID(),
				ReceiptHandle: receiptHandle,
				VisibilityTimeout: visibilityTimeout
			}))}, "ChangeMessageVisibilityBatch", queueSettings, false);
		return true;
	}
}
export type * from "./schemas";
