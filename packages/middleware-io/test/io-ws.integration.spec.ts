import { createWebSocketsTestBed } from '@marblejs/websockets/dist/+internal';
import { createWebSocketServer } from '@marblejs/websockets';
import { listener } from './io-ws.integration';

describe('@marblejs/middleware-io - WebSocket integration', () => {
  const testBed = createWebSocketsTestBed();

  beforeEach(testBed.bootstrap);
  afterEach(testBed.teardown);

  test('[POST_USER] sends user object', async done => {
    // given
    const user = { id: 'id', age: 100, };
    const event = JSON.stringify({ type: 'POST_USER', payload: user });
    const server = testBed.getServer();
    const targetClient = testBed.getClient();

    // when
    const app = await createWebSocketServer({ options: { server }, listener });
    await app();

    targetClient.once('open', () => targetClient.send(event));

    // then
    targetClient.once('message', message => {
      expect(message).toEqual(event);
      done();
    });
  });

  test('[POST_USER] throws an error if incoming object is invalid', async done => {
    // given
    const server = testBed.getServer();
    const targetClient = testBed.getClient();
    const user = { id: 'id', age: '100', };
    const event = JSON.stringify({ type: 'POST_USER', payload: user });
    const expectedError = {
      type: 'POST_USER',
      error: {
        name: 'EventError',
        message: 'Validation error',
        data: [{ path: 'age', expected: 'number', got: '"100"' }],
      },
    };

    // when
    const app = await createWebSocketServer({ options: { server }, listener });
    await app();

    targetClient.once('open', () => targetClient.send(event));

    // then
    targetClient.once('message', message => {
      const parsedMessage = JSON.parse(message);
      expect(parsedMessage).toEqual(expectedError);
      done();
    });
  });
});
