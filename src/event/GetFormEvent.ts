import FormEvent from './FormEvent';

export default class GetFormEvent implements FormEvent {
    public readonly eventDate: Date;
    public readonly formId: string;

}
