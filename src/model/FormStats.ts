import {ApiModel} from 'swagger-express-ts';
import {Table} from 'sequelize-typescript';

@ApiModel({
    description: 'Database representation of stats associated with a form',
    name: 'FormStats',

})
export default class FormStats {

    private formId: string;
    private totalGets: number;
    private totalPuts: number;
    private numberOfComments: number;
    private numberOfVersions: number;
    private environment: number;
}
