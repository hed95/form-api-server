import {Container} from 'inversify';

export class ApplicationContext {
    private readonly container: Container;

    constructor() {
        this.container = new Container({
            defaultScope: 'Singleton'
        });
    }

    public iocContainer(): Container {
        return this.container;
    }
}
