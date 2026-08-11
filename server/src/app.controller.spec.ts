import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsrfService } from './auth/csrf.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: CsrfService,
          useValue: {
            generateCsrfToken: jest.fn().mockReturnValue('mock_csrf_token'),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('csrf-token', () => {
    it('should return csrf token object', () => {
      const req = {} as any;
      const res = {} as any;
      const result = appController.getCsrfToken(req, res);
      expect(result).toEqual({ success: true, csrfToken: 'mock_csrf_token' });
    });
  });
});

