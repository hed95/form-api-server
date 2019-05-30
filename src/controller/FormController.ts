import {BaseHttpController, controller} from "inversify-express-utils";
import {inject} from "inversify";
import TYPE from "../constant/TYPE";
import {FormService} from "../service/FormService";

@controller("/api/form")
export class FormController extends BaseHttpController {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService) {
        super();
    }

}
