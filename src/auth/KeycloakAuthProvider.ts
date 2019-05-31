import {interfaces} from "inversify-express-utils";
import * as express from 'express';
import {injectable} from "inversify";

@injectable()
export class KeycloakAuthProvider implements interfaces.AuthProvider {
    public async getUser(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): Promise<interfaces.Principal> {

        return Promise.resolve(null);
    }
}
