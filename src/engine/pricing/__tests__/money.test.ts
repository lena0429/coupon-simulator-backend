import { describe, it, expect } from 'vitest';
import { roundMoney, calculatePercentage } from '../money';

describe('Money utilities', () => {
  describe('roundMoney', () => {
    it('should round to 2 decimal places', () => {
      expect(roundMoney(10.123)).toBe(10.12);
      expect(roundMoney(10.126)).toBe(10.13);
      expect(roundMoney(10.125)).toBe(10.13);
    });

    it('should handle floating point arithmetic errors', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(0.07 * 100)).toBe(7);
    });

    it('should handle whole numbers', () => {
      expect(roundMoney(10)).toBe(10);
      expect(roundMoney(100.0)).toBe(100);
    });

    it('should handle negative numbers', () => {
      expect(roundMoney(-10.126)).toBe(-10.13);
      expect(roundMoney(-0.1 - 0.2)).toBe(-0.3);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(100, 10)).toBe(10);
      expect(calculatePercentage(50, 20)).toBe(10);
      expect(calculatePercentage(200, 5)).toBe(10);
    });

    it('should round result to 2 decimals', () => {
      expect(calculatePercentage(33.33, 10)).toBe(3.33);
      expect(calculatePercentage(99.99, 15)).toBe(15);
    });

    it('should handle zero percentage', () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it('should handle zero amount', () => {
      expect(calculatePercentage(0, 10)).toBe(0);
    });
  });
});
