import { Router } from 'express';
import UserController from '../controller/UserController';
import { validateAdminJwt, validateJwt } from '../middleware/JwtValidator';

const userRouter = Router();
userRouter.post('/', UserController.add);
userRouter.get('/:userId', UserController.one);
userRouter.get('/', [validateAdminJwt], UserController.all);

userRouter.get('/:userId/addresses', [validateJwt], UserController.getAllShippingAddresses);
userRouter.post('/:userId/addresses', [validateJwt], UserController.addShippingAddress);
userRouter.delete('/:userId/addresses/:addressId', [validateJwt], UserController.deleteShippingAddress);

export default userRouter;
