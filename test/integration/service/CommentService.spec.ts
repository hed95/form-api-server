import {User} from "../../../src/auth/User";
import {expect} from "chai";
import ResourceNotFoundError from "../../../src/error/ResourceNotFoundError";
import {Role} from "../../../src/model/Role";
import {FormVersion} from "../../../src/model/FormVersion";
import {FormComment} from "../../../src/model/FormComment";
import {FormRepository} from "../../../src/types/repository";
import {applicationContext} from "../setup-test";
import TYPE from "../../../src/constant/TYPE";
import {CommentService} from "../../../src/service/CommentService";

describe('CommentService', () => {

    const formRepository: FormRepository = applicationContext.get(TYPE.FormRepository);
    const commentService: CommentService = applicationContext.get(TYPE.CommentService);

    let role: Role;
    before(async () => {
        role = await new Role({
            name: "Role for ABC",
            title: "Test title",
            active: true
        }).save();

    });

    it('throws exception if form does not exist on create comment', async () => {
        try {
            const user = new User("id", "test", [role]);
            await commentService.createComment('random', user, null);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });

    it('can create comment', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const user = new User("id", "test", [role]);
        const formComment = new FormComment({
            comment: "FormCommentary test"
        });
        const comment: FormComment = await commentService.createComment(form.id, user, formComment);
        console.log(comment.createdOn);
        expect(comment).to.be.not.null;

    });

    it('can get comments', async () => {
        const form = await formRepository.create({
            createdBy: "test@test.com"
        });

        const defaultRole = await Role.defaultRole();

        await form.$add("roles", [defaultRole]);

        await new FormVersion({
            name: "Test Form ABC 123",
            title: "Test form title",
            schema: {
                components: [],
                display: "wizard"
            },
            formId: form.id,
            latest: true,
            validFrom: new Date(),
            validTo: null
        }).save();

        const user = new User("id", "test", [role]);
        const formComment = new FormComment({
            comment: "FormCommentary test"
        });
        await commentService.createComment(form.id, user, formComment);
        const result: { total: number, comments: FormComment[] } = await commentService.comments(form.id, user);
        expect(result.total).to.be.eq(1);
        expect(result.comments[0].createdBy).to.be.eq("test");
    });

    it('throws error if form does not exist for get comments call', async () => {
        try {
            const user = new User("id", "test", [role]);
            await commentService.comments('xx', user);
        } catch (e) {
            expect(e instanceof ResourceNotFoundError).to.be.eq(true);
        }
    });
});
