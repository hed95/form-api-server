import {BaseHttpController, controller, httpGet, queryParam} from "inversify-express-utils";
import {Role} from "../model/Role";
import logger from "../util/logger";
import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {RoleRepository} from "../types/repository";

@controller("/api/roles")
export class RolesController extends BaseHttpController {

    constructor(@inject(TYPE.RoleRepository) private readonly roleRepository: RoleRepository) {
        super();
    }

    @httpGet('/:id', TYPE.ProtectMiddleware)
    public async roles(@queryParam("limit") limit: number = 20, @queryParam("offset") offset: number = 0): Promise<{ total: number, roles: Role[] }> {
        const profiler = logger.startTimer();
        const result: { rows: Role[], count: number } = await this.roleRepository.findAndCountAll({
            limit: limit,
            offset: offset
        });
        profiler.done({message: "roles returned"});
        return {
            total: result.count,
            roles: result.rows
        }
    }
}
