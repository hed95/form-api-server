import FormEvent from './FormEvent';

export default class UpdateFormEvent implements FormEvent {
    public readonly eventDate: Date;
    public readonly formId: string;

}
