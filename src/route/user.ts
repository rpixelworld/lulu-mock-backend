import { Router } from 'express';
import UserController from '../controller/UserController';
import { validateAdminJwt, validateJwt } from '../middleware/JwtValidator';

const userRouter = Router();
userRouter.post('/', UserController.add);
userRouter.get('/:userId', UserController.one);
userRouter.get('/', [validateAdminJwt], UserController.all);

userRouter.get('/addresses/user', [validateJwt], UserController.getAllShippingAddresses);
userRouter.post('/addresses', [validateJwt], UserController.addShippingAddress);
userRouter.delete('/addresses/:addressId', [validateJwt], UserController.deleteShippingAddress);

export default userRouter;
