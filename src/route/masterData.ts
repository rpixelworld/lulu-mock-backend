import {Router} from "express";
import MasterDataController from "../controller/MasterDataController";

const masterDataRouter = Router();
masterDataRouter.post("/tax-rates/:province", MasterDataController.getTaxRate);

export default masterDataRouter;