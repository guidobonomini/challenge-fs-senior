import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken, hashPassword, comparePassword } from '../../utils/auth';

// Mock jwt and bcrypt
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Utils', () => {
  beforeEach(() => {
    // Set JWT_SECRET before importing the module
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    test('should generate a token with user payload', () => {
      const mockToken = 'mocked-jwt-token';
      mockedJwt.sign = jest.fn().mockReturnValue(mockToken);

      const user = { id: '123', email: 'test@example.com', role: 'member' };
      const result = generateToken(user);

      expect(result).toBe(mockToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { id: '123', email: 'test@example.com', role: 'member' },
        'fallback-secret',
        { expiresIn: '7d' }
      );
    });

    test('should use default expiration if not provided', () => {
      const mockToken = 'mocked-jwt-token';
      mockedJwt.sign = jest.fn().mockReturnValue(mockToken);

      const user = { id: '123', email: 'test@example.com', role: 'member' };
      generateToken(user);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'fallback-secret',
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyToken', () => {
    test('should verify and return decoded token', () => {
      const mockDecoded = { id: '123', email: 'test@example.com', role: 'member' };
      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded);

      const token = 'valid-token';
      const result = verifyToken(token);

      expect(result).toEqual(mockDecoded);
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'fallback-secret');
    });

    test('should return null for invalid token', () => {
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const token = 'invalid-token';
      const result = verifyToken(token);
      
      expect(result).toBeNull();
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'fallback-secret');
    });
  });

  describe('hashPassword', () => {
    test('should hash password with default salt rounds', async () => {
      const mockHash = 'hashed-password';
      mockedBcrypt.hash = jest.fn().mockResolvedValue(mockHash);

      const password = 'plain-password';
      const result = await hashPassword(password);

      expect(result).toBe(mockHash);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    test('should return true for matching passwords', async () => {
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true);

      const password = 'plain-password';
      const hash = 'hashed-password';
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    test('should return false for non-matching passwords', async () => {
      mockedBcrypt.compare = jest.fn().mockResolvedValue(false);

      const password = 'wrong-password';
      const hash = 'hashed-password';
      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });
});