require('dotenv').config();

const expect = require('chai').expect;

const HealthBot = require('../business_logic/health_bot');

const server = new HealthBot();

describe('health bot', function() {
    it('get methods', async () => {
        const methods = await server.getMethods();

        expect(methods).to.have.lengthOf(8);
        expect(methods[0]).to.have.property('name');
        expect(methods[0]).to.have.property('image');
        expect(methods[0]).to.have.property('how_to');
    });

    it('get method card', async () => {
        const card = await server.getMethodCard();

        expect(card).to.have.a.property('cards');
    });

    it('send remedy', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

        await server.sendRemedy();
    });
});