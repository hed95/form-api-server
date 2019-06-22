import * as express from 'express';

export interface ResourceAssembler<FROM, TO> {

    toResource(entity: FROM, req: express.Request, includeLinks?: boolean): TO;

}
