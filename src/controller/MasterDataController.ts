import {Request, Response} from "express";
import gDB from "../InitDataSource";
import {TaxMaster} from "../entity/TaxMaster.entity";
import {Province} from "../common/Province";
import {logger} from "../LoggerHelper";
import ResponseHelper from "./ResponseHelper";
import {ErrorCode} from "../common/ErrorCode";

class MasterDataController {
    static async getTaxRate(req: Request, res: Response): Promise<void> {
        const db = gDB.getRepository(TaxMaster);

        try {
            const {province} = req.params; // Assuming province is sent as a URL parameter
            const taxRate = await db.findOne({where: {province: province as Province}});

            if (taxRate) {
                logger.info(`Tax rate found: ${JSON.stringify(taxRate)}`);
                res.status(200).send(ResponseHelper.generateSuccessResult({
                    province,
                    gst: taxRate.gst,
                    pst: taxRate.pst,
                    hst: taxRate.hst
                }));
            } else {
                logger.warn(`Tax rate not found for province: ${province}`);
                res.status(400).send(
                    ResponseHelper.generateFailureResult(
                        ErrorCode.TAX_RATE_NOT_FOUND,
                        'Tax rate not found',
                    ),
                );
            }
        } catch (e) {
            logger.error('Server error:', e);
            res.status(500).send(
                ResponseHelper.generateFailureResult(
                    ErrorCode.DB_ERROR,
                    e.driverError,
                ),
            );
        }
    }
}

export default MasterDataController;
