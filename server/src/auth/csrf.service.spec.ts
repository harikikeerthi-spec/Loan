import { CsrfService, doubleCsrfProtection } from './csrf.service';
import { Request, Response } from 'express';

describe('CsrfService Unit Tests', () => {
  let csrfService: CsrfService;

  beforeEach(() => {
    csrfService = new CsrfService();
  });

  it('should generate a valid CSRF token and set cookie', () => {
    const cookies: Record<string, string> = {};
    const headers: Record<string, string> = {};

    const req = {
      cookies: {},
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const res = {
      cookie: (name: string, value: string, options: any) => {
        cookies[name] = value;
      },
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
    } as unknown as Response;

    const token = csrfService.generateCsrfToken(req, res);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
    expect(cookies['x-csrf-token']).toBeDefined();
  });

  it('should reject mutating requests without X-CSRF-Token header', (done) => {
    const req = {
      method: 'POST',
      cookies: { 'x-csrf-token': 'dummy_cookie' },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const res = {} as Response;

    doubleCsrfProtection(req, res, (err: any) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should accept mutating requests with valid X-CSRF-Token header and cookie pair', (done) => {
    let setCookieHeader = '';
    const reqGet = {
      cookies: {},
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const resGet = {
      cookie: (name: string, value: string) => {
        setCookieHeader = value;
      },
      setHeader: () => {},
    } as unknown as Response;

    const token = csrfService.generateCsrfToken(reqGet, resGet);

    const reqPost = {
      method: 'POST',
      cookies: { 'x-csrf-token': setCookieHeader },
      headers: {
        'x-csrf-token': token,
      },
      ip: '127.0.0.1',
    } as unknown as Request;

    const resPost = {} as Response;

    doubleCsrfProtection(reqPost, resPost, (err: any) => {
      expect(err).toBeUndefined();
      done();
    });
  });
});
