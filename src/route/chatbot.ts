import { Router } from 'express';
import ProductController from '../controller/ProductController';
import * as multer from 'multer';
import ChatBotController from '../controller/ChatBotController';


const chatbotRouter = Router();
chatbotRouter.post('/prompt', ChatBotController.userPrompt)
chatbotRouter.get('/history', ChatBotController.loadChatHistory)
chatbotRouter.post('/reset', ChatBotController.resetChatHistory)

export default chatbotRouter;
