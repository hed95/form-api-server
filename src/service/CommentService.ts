import {provide} from 'inversify-binding-decorators';
import TYPE from '../constant/TYPE';
import {inject} from 'inversify';
import {FormCommentRepository} from '../types/repository';
import {User} from '../auth/User';
import {FormComment} from '../model/FormComment';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import {FormService} from './FormService';
import {Op} from 'sequelize';

@provide(TYPE.CommentService)
export class CommentService {

    constructor(@inject(TYPE.FormService) private readonly formService: FormService,
                @inject(TYPE.FormCommentRepository) private readonly formCommentRepository: FormCommentRepository) {

    }

    public async comments(formId: string,
                          user: User,
                          offset: number = 0,
                          limit: number = 20): Promise<{ total: number, comments: FormComment[] }> {

        const result: { rows: FormComment[], count: number } = await
            this.formCommentRepository.sequelize.transaction(async () => {
                const form = await this.formService.getForm(formId, user);
                if (!form) {
                    throw new ResourceNotFoundError(`Form with id ${formId} does not exist`);
                }
                return await this.formCommentRepository.findAndCountAll({
                    limit,
                    offset,
                    where: {
                        formId: {
                            [Op.eq]: formId,
                        },
                    },
                });
            });

        return {
            total: result.count,
            comments: result.rows,
        };
    }

    public async createComment(id: string, user: User, comment: FormComment): Promise<FormComment> {
        const form = await this.formService.getForm(id, user);
        if (!form) {
            throw new ResourceNotFoundError(`Form with id ${id} does not exist`);
        }
        const today = new Date();
        if (!comment.createdOn) {
            comment.createdOn = today;
        }
        if (!comment.createdBy) {
            comment.createdBy = user.details.email;
        }
        return await this.formCommentRepository.sequelize.transaction(async () => {
            const created: FormComment = await this.formCommentRepository.create({
                comment: comment.comment,
                createdOn: comment.createdOn,
                createdBy: comment.createdBy,
            }, {});
            await created.$set('form', form);
            return created;
        });
    }

}
