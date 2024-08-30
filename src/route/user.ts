import { Router } from 'express';
import UserController from '../controller/UserController';
import { validateAdminJwt, validateJwt } from '../middleware/JwtValidator';

const userRouter = Router();
userRouter.post('/', UserController.add);
userRouter.get('/:userId', UserController.one);
userRouter.put('/:userId', UserController.update);
userRouter.get('/', [validateAdminJwt], UserController.all);

userRouter.get('/addresses/user', [validateJwt], UserController.getAllShippingAddresses);
userRouter.post('/addresses', UserController.addShippingAddress);
userRouter.put('/addresses/:addressId', [validateJwt], UserController.updateAddress);
userRouter.delete('/addresses/:addressId', [validateJwt], UserController.deleteShippingAddress);

export default userRouter;
