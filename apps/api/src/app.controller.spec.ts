import { AppController } from './app.controller.js';

describe('AppController', () => {
  const appController =
    new AppController();

  describe('root', () => {
    it('should return API metadata', () => {
      expect(
        appController.getRoot(),
      ).toEqual({
        name:
          'Hiffs Connect API',
        status: 'online',
        version: '0.1.0',
      });
    });
  });

  describe('health', () => {
    it(
      'should return healthy service status',
      () => {
        const result =
          appController.getHealth();

        expect(
          result.status,
        ).toBe('ok');

        expect(
          result.service,
        ).toBe(
          'hiffs-connect-api',
        );

        expect(
          Number.isNaN(
            Date.parse(
              result.timestamp,
            ),
          ),
        ).toBe(false);
      },
    );
  });
});