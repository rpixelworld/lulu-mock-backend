import { Router } from 'express';
import InventoryController from '../controller/InventoryController';

const inventoryRouter = Router();
inventoryRouter.get('/:productId', InventoryController.getProductInventory);
inventoryRouter.get('/:productId/:colorId/:size', InventoryController.getInventory);
inventoryRouter.get('/:productId/:colorId', InventoryController.getInventoryOfProductAndColor);
inventoryRouter.put('/:productId/:colorId/:size', InventoryController.updateInventory);

export default inventoryRouter;
