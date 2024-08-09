import {IdCheckRes} from "../controller/CheckIdController";
import {logger} from "../LoggerHelper";
import {User} from "../entity/User.entity";
import OrderController from "../controller/OrderController";
import gDB from "../InitDataSource";
import {ShippingAddress} from "../entity/ShippingAddress.entity";


export const ValidateOrder = async (userId:number,shippingAddressId:number) =>{
    if (typeof userId!=='number' || userId<=0 ||
         typeof shippingAddressId!=='number' || shippingAddressId<=0) {
        throw (new Error("Invalid userId or shipping address or orderItems"));
    }
    const user = await gDB.getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
        throw new Error('Invalid userId ' + userId);
    }

    const shippingAddress = await gDB.getRepository(ShippingAddress).findOne({ where: { id: shippingAddressId } });
    if (!shippingAddress) {
        throw new Error('Invalid shippingAddressId ' + shippingAddressId);
    }
    const res:IdCheckRes[]=[]
    try {
        // check userIdId
        console.log('o1',[userId])
        let temp= await OrderController.checkIdExits(userId, gDB.getRepository(User));
        console.log('o2')
        console.log(temp)
        if (!temp.exists) {
            throw (new Error('Invalid userIdId '));
        }
        res.push(temp);
        // check shippingAddressIdId
        temp = await OrderController.checkIdExits(shippingAddressId, gDB.getRepository(ShippingAddress));
        if (!temp.exists) {
            throw (new Error("Invalid shippingAddressIdId "))
        }
        res.push(temp);
        // check orderItems
        // temp= await OrderController.checkIdExits(orderItems, gDB.getRepository(OrderItem));
        // if (temp.index!==-1) {
        //     throw (new Error('Invalid orderItemId '+temp.index))
        // }
        // res.push(temp);
        // return
        return res
    } catch (e) {
        logger.error(e)
        throw (new Error('some id is wrong'+e.message))
    }
}