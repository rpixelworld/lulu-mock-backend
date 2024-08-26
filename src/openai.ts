import OpenAI from "openai";

import { config } from 'dotenv-flow';
import { logger } from './LoggerHelper';
import { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

if (!process.env.OPENAI_API_KEY) {
	config();
}

const openai = new OpenAI();

async function testFunctionCall() {
	const tools: any[] = [
		{
			type: "function",
			function: {
				name: "get_recent_order",
				description: "Get customer's recent order",
				parameters: {
					type: "object",
					properties: {
						email: {
							type: "string",
							description: "The customer's login as email.",
						},
					},
					required: ["email"],
					additionalProperties: false,
				},
			}
		}
	]

	const messages: any[] = [
		{ role: "system", content: "I am your lulu bot assistent, how can I help you today?" },
		{ role: "user", content: "What's my order status" },
		{ role: "assistant", content: "Could you please provide me with your email address so I can look up your recent order?" },
		{ role: "user", content: "rita@gmail.com" },
		// {
		// 	tool_calls: [
		// 		{ id: "call_62136354" }
		// 	]
		// },
		// {
		// 	role: "tool",
		// 	content: JSON.stringify({orders:
		// 		['00000067', '00000068']
		// 	}),
		// 	tool_call_id: 'call_62136354'
		// }
	];
	// messages.push({
	// 	"role": "assistant",
	// 	"content": null,
	// 	"tool_calls": [
	// 		{
	// 			"id": "call_bi4ftvFWbP6SjKgT0F69sXNw",
	// 			"type": "function",
	// 			"function": {
	// 				"name": "get_all_orders",
	// 				"arguments": '{email:"rita@gmail.com"}'
	// 			}
	// 		}
	// 	],
	// 	"refusal": null
	// })
	// messages.push({
	// 	role: "tool",
	// 	content: JSON.stringify({
	// 		orders: ['00000056', '00000089']
	// 	}),
	// 	tool_call_id: 'call_bi4ftvFWbP6SjKgT0F69sXNw'
	// })

	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: messages,
		// tools: tools
	});
	console.log(JSON.stringify(response))
}

testFunctionCall()


const getDeliveryDate = async (orderId: string): Promise<string> => {
	return 'today'
}

