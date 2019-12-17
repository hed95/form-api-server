import FormEvent from './FormEvent';

export default class CreateCommentEvent implements FormEvent {
    public readonly eventDate: Date;
    public readonly formId: string;
    public readonly commentId: string;

    constructor(formId: string, commentId: string) {
        this.formId = formId;
        this.commentId = commentId;
        this.eventDate = new Date();
    }

    public toString() {
        return `Comment ${this.commentId} for form ${this.formId} was created on ${this.eventDate}`;
    }
}
