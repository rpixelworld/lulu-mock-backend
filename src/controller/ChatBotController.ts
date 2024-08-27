import { Request, Response } from 'express';
import OpenAI from 'openai';
import ResponseHelper from './ResponseHelper';
import gDB from '../InitDataSource';
import { Order } from '../entity/Order.entity';
import { User } from '../entity/User.entity';
import { SelectQueryBuilder } from 'typeorm';
import AppHelper from '../AppHelper';
import { OrderStatus } from '../common/OrderStatus';

const openai = new OpenAI();
const tools: any[] = [
	{
		type: 'function',
		function: {
			name: 'get_recent_order',
			description: "Get customer's recent order",
			parameters: {
				type: 'object',
				properties: {
					email: {
						type: 'string',
						description: "The customer's login as email.",
					},
				},
				required: ['email'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'get_payment_link',
			description: 'Get payment link of an order',
			parameters: {
				type: 'object',
				properties: {
					orderId: {
						type: 'string',
						description: 'order id to generate payment link',
					},
				},
				required: ['orderId'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'get_shippment_data',
			description: 'Get planned shipment date of an order',
			parameters: {
				type: 'object',
				properties: {
					orderId: {
						type: 'string',
						description: 'order id to for any order',
					},
				},
				required: ['orderId'],
				additionalProperties: false,
			},
		},
	},
];

const messagePayload: any[] = [];
messagePayload.push({
	role: 'system',
	content: 'My name is LULUBot, I am your shopping assistent. How can I help you today?',
});

class ChatBotController {
	static async userPrompt(req: Request, res: Response): Promise<any> {
		const prompt = req.body.prompt;

		messagePayload.push({ role: 'user', content: prompt });
		const aiResponse = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			tools: tools,
			messages: messagePayload,
		});
		// console.log(JSON.stringify(aiResponse))

		let aiResults: any[] = [];
		if (aiResponse.choices[0].finish_reason == 'tool_calls') {
			messagePayload.push(aiResponse.choices[0].message);

			const toolCall = aiResponse.choices[0].message.tool_calls[0];
			aiResults = await execustToolCall(
				toolCall.id,
				toolCall.function.name,
				JSON.parse(toolCall.function.arguments)
			);
		} else {
			aiResults = [
				{
					role: aiResponse.choices[0].message.role,
					content: aiResponse.choices[0].message.content,
				},
			];
		}

		aiResults.forEach(r => messagePayload.push(r));
		// messagePayload.push(aiResults)
		// console.log(messagePayload)
		return res.status(200).send(ResponseHelper.generateSuccessResult(aiResults));
	}

	static async loadChatHistory(req: Request, res: Response) {
		const payloadHistory = messagePayload.filter(message => message.content);
		return res.status(200).send(ResponseHelper.generateSuccessResult(payloadHistory));
	}

	static async resetChatHistory(req: Request, res: Response) {
		messagePayload.splice(1);
		// console.log(messagePayload)
		return res.status(200).send(ResponseHelper.generateSuccessResult({}));
	}
}

export default ChatBotController;

async function execustToolCall(toolcallId: string, toolName: string, args: any) {
	switch (toolName) {
		case 'get_recent_order':
			const email = args.email;
			const user = await getUserByEmail(email);
			if (!user) {
				return [
					{
						role: 'tool',
						content: "I can't find the email in our system, please send me the correct one. ",
						tool_call_id: toolcallId,
					},
				];
			}
			const recentOrder: Order = await getRecentOrder(email);
			if (!recentOrder) {
				return [
					{
						role: 'tool',
						content: 'It seems you there is no order associated with your email.',
						tool_call_id: toolcallId,
					},
				];
			} else {
				const resultArr = [
					{
						role: 'tool',
						content: `You recent order number is ${String(recentOrder.id).padStart(10, '0')}, the status is ${AppHelper.getEnumKeyByValue(OrderStatus, recentOrder.status)}`,
						tool_call_id: toolcallId,
					},
				];

				return resultArr;
			}
		// break
		case 'get_payment_link':
			const paymentLink = getPaymentLink(args.orderId);
			return [
				{
					role: 'tool',
					content: `Your payment link is <a href="${paymentLink}">Pay your order</a>`,
					tool_call_id: toolcallId,
				},
			];

		case 'get_shippment_data':
			const order: Order = await getSingleOrder(args.orderId);
			if (!order) {
				return [
					{
						role: 'tool',
						content:
							"I can't find the order by the order number you provided, please check and reply with the correct order number. ",
						tool_call_id: toolcallId,
					},
				];
			}
			if (order.status == OrderStatus.UNPAID) {
				return [
					{
						role: 'tool',
						content: "I'm sorry we are not able to ship your order, since it's not paid yet. ",
						tool_call_id: toolcallId,
					},
				];
			}
			if (order.status == OrderStatus.SHIPPED) {
				return [
					{
						role: 'tool',
						content: `Your order has been shipped to your address at ${AppHelper.formatDate(order.updatedAt)}`,
						tool_call_id: toolcallId,
					},
				];
			}
			const plannedDate = AppHelper.formatDate(order.plannedShipmentDate);
			return [
				{ role: 'tool', content: `Your order will be shipped before ${plannedDate}`, tool_call_id: toolcallId },
			];
		default:
			return [{ role: 'tool', content: 'I am still learning, please comeback later', tool_call_id: toolcallId }];
			break;
	}
}

async function getUserByEmail(email: string) {
	return await gDB.getRepository(User).findOne({ where: { email: email } });
}

async function getRecentOrder(email: string): Promise<Order> {
	const repo = gDB.getRepository(Order);
	let queryBuilder: SelectQueryBuilder<Order> = repo.createQueryBuilder('order');
	queryBuilder
		.innerJoin('order.user', 'user')
		.where('user.email=:email', { email: email })
		.orderBy('order.createdAt', 'DESC')
		.take(1);
	return await queryBuilder.getOne();
}

function getPaymentLink(orderId: string) {
	return `${process.env.LULU_BASE_URL}/shop/checkout/payment/${Number(orderId)}`;
}

async function getSingleOrder(orderId: string) {
	return await gDB.getRepository(Order).findOne({ where: { id: Number(orderId) } });
}
