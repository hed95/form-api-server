import Prometheus from 'prom-client';

const getFormCountGenerator = (prefix: string = '') => {
    return new Prometheus.Counter({
        name: `${prefix}get_form_counter`,
        help: 'Total number of requests for form',
        labelNames: ['name']
    })
};

export {
    getFormCountGenerator
}
