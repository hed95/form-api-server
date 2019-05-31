import {interfaces} from "inversify-express-utils";
import * as express from 'express';
import {inject, injectable} from "inversify";
import {User} from "./User";
import TYPE from "../constant/TYPE";
import {KeycloakService} from "./KeycloakService";
import {Role} from "../model/Role";
import Keycloak = require("keycloak-connect");
import logger from "../util/logger";

@injectable()
export class KeycloakAuthProvider implements interfaces.AuthProvider {
    constructor(@inject(TYPE.KeycloakService) private readonly keycloakService: KeycloakService) {
    }
    public async getUser(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): Promise<interfaces.Principal> {
        const instance: Keycloak = this.keycloakService.keycloakInstance();
        try {
            const grant: Keycloak.Grant = await instance.getGrant(req, res);
            // @ts-ignore
            const email = grant.access_token.content.email;
            const roles = grant.access_token.content.realm_access.roles.map((role: string) => {
                return new Role({name: role});
            });
            const user = new User(email, email, roles);
            return Promise.resolve(user);
        } catch (err) {
            logger.warn("Failed to get user details", {
                error: err.toString()
            });
            return Promise.resolve(null);
        }

    }
}
