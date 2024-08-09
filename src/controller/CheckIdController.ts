export interface IdCheckRes {
    exists: boolean;
    entities: any[];
}

export class CheckIdController {
    public static async checkIdExits(id: number, repo: any): Promise<IdCheckRes> {
        const res: IdCheckRes = {exists: false, entities: []};
        try {
            const checkId = await repo.findOne({where: {id}});
            if (checkId) {
                res.exists = true;
                res.entities.push(checkId);
            }
            return res;
        } catch (error) {
            throw new Error('Invalid ID: ' + error);
        }
    }
}
