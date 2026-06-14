// calculator.test.ts
import { add, divide } from './calculator';

describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  it('should divide two numbers correctly', () => {
    expect(divide(6, 2)).toBe(3);
    expect(divide(10, 5)).toBe(2);
    expect(divide(0, 5)).toBe(0);
  });

  it('should throw an error when dividing by zero', () => {
    expect(() => divide(1, 0)).toThrow('Cannot divide by zero');
  });
});
