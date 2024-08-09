import { Router } from 'express';
import userRouter from './user';
import authRouter from './auth';
import orderRouter from './order';
import inventoryRouter from './inventory';
import masterDataRouter from './masterData';
import paypalRouter from './paypal';

const rootRouter = Router();
rootRouter.use('/users', userRouter);
rootRouter.use('/auth', authRouter);
rootRouter.use('/orders', orderRouter);
rootRouter.use('/inventory', inventoryRouter);
rootRouter.use('/master', masterDataRouter);
rootRouter.use('/paypal', paypalRouter);
export default rootRouter;
