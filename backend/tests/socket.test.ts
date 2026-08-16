import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { app } from '../src/server';
import { setupSockets } from '../src/sockets/socketHandler';
import { Parent } from '../src/models/Parent';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

describe('Socket.IO Tests', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer(app);
    io = new Server(httpServer);
    setupSockets(io);
    
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close();
    done();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should reject unauthenticated socket connections', (done) => {
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on('connect_error', (err) => {
      expect(err.message).toBe('Authentication error: Token missing');
      done();
    });
  });

  it('should authenticate valid parent socket', (done) => {
    // Mock a JWT
    const mockToken = jwt.sign({ id: '5f9f1b9b9c9d440000000000', role: 'parent' }, env.JWT_SECRET || 'secret');
    
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: mockToken }
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });
});
