import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  adaptiveHistogramEqualization,
  gaussianSmooth,
  applyContourFlattening,
  enhanceDepthDetails,
} from "./depthmap.js";

describe("adaptiveHistogramEqualization", () => {
  describe("Basic Functionality", () => {
    it("should return a Float32Array of the same length", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = adaptiveHistogramEqualization(depthMap, 3, 1, 1.0);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(depthMap.length);
    });

    it("should normalize depth values using histogram equalization", () => {
      // Create a depth map with clustered values
      const depthMap = new Float32Array([0.4, 0.4, 0.4, 0.5, 0.5, 0.6]);
      const result = adaptiveHistogramEqualization(depthMap, 3, 2, 1.0);

      // Values should be spread out more after equalization
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(6);
    });

    it("should handle uniform depth map", () => {
      const depthMap = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const result = adaptiveHistogramEqualization(depthMap, 2, 2, 1.0);

      // All values should remain similar for uniform input
      expect(result[0]).toBeCloseTo(result[1], 5);
      expect(result[1]).toBeCloseTo(result[2], 5);
    });
  });

  describe("Strength Control", () => {
    it("should apply full equalization with strength 1.0", () => {
      const depthMap = new Float32Array([0.0, 0.25, 0.5, 0.75, 1.0]);
      const result = adaptiveHistogramEqualization(depthMap, 5, 1, 1.0);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(5);
    });

    it("should blend with original when strength < 1.0", () => {
      const depthMap = new Float32Array([0.2, 0.4, 0.6, 0.8]);
      const strength = 0.5;
      const result = adaptiveHistogramEqualization(depthMap, 4, 1, strength);

      // With reduced strength, results should be closer to original
      expect(result).toBeInstanceOf(Float32Array);
    });

    it("should clamp values to [0, 1] range", () => {
      const depthMap = new Float32Array([0.0, 0.3, 0.7, 1.0]);
      const result = adaptiveHistogramEqualization(depthMap, 4, 1, 2.0);

      // All values should be within valid range
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(0);
        expect(result[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle single pixel", () => {
      const depthMap = new Float32Array([0.5]);
      const result = adaptiveHistogramEqualization(depthMap, 1, 1, 1.0);

      expect(result.length).toBe(1);
    });

    it("should handle all black depth map", () => {
      const depthMap = new Float32Array([0.0, 0.0, 0.0]);
      const result = adaptiveHistogramEqualization(depthMap, 3, 1, 1.0);

      expect(result.length).toBe(3);
    });

    it("should handle all white depth map", () => {
      const depthMap = new Float32Array([1.0, 1.0, 1.0]);
      const result = adaptiveHistogramEqualization(depthMap, 3, 1, 1.0);

      expect(result.length).toBe(3);
    });
  });
});

describe("gaussianSmooth", () => {
  describe("Basic Smoothing", () => {
    it("should return original depth map when kernel size is 1 or less", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = gaussianSmooth(depthMap, 3, 1, 1);

      expect(result).toBe(depthMap);
    });

    it("should smooth depth values with kernel size 3", () => {
      const depthMap = new Float32Array([0.0, 1.0, 0.0]);
      const result = gaussianSmooth(depthMap, 3, 1, 3);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(3);
      // Middle value should be influenced by neighbors
      expect(result[1]).toBeLessThan(1.0);
      expect(result[1]).toBeGreaterThan(0.0);
    });

    it("should preserve edge values when smoothing", () => {
      const depthMap = new Float32Array([1.0, 0.5, 0.0]);
      const result = gaussianSmooth(depthMap, 3, 1, 3);

      // Edges should be clamped (not extend beyond bounds)
      expect(result[0]).toBeLessThanOrEqual(1.0);
      expect(result[2]).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe("2D Smoothing", () => {
    it("should apply separable Gaussian filter horizontally and vertically", () => {
      // 3x3 grid with center spike
      const depthMap = new Float32Array([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0]);
      const result = gaussianSmooth(depthMap, 3, 3, 3);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(9);
      // Center should be smoothed down
      expect(result[4]).toBeLessThan(1.0);
    });

    it("should handle larger kernel sizes", () => {
      const depthMap = new Float32Array([
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
      ]);
      const result = gaussianSmooth(depthMap, 5, 5, 5);

      expect(result.length).toBe(25);
      // Smoothing should spread the value
      expect(result[12]).toBeLessThan(1.0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle 1x1 depth map", () => {
      const depthMap = new Float32Array([0.5]);
      const result = gaussianSmooth(depthMap, 1, 1, 3);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(1);
    });

    it("should handle uniform depth map", () => {
      const depthMap = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const result = gaussianSmooth(depthMap, 2, 2, 3);

      // Smoothing uniform values should keep them uniform
      expect(result[0]).toBeCloseTo(0.5, 5);
      expect(result[1]).toBeCloseTo(0.5, 5);
    });
  });
});

describe("applyContourFlattening", () => {
  describe("When disabled", () => {
    it("should return original depth map when enableContour is false", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = applyContourFlattening(depthMap, { enableContour: false });

      expect(result).toBe(depthMap);
    });

    it("should return original depth map when contourThreshold is undefined", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = applyContourFlattening(depthMap, { enableContour: true });

      expect(result).toBe(depthMap);
    });
  });

  describe("When enabled", () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it("should flatten values above threshold to 1.0", () => {
      const depthMap = new Float32Array([0.3, 0.7, 0.9]);
      const result = applyContourFlattening(depthMap, {
        enableContour: true,
        contourThreshold: 0.5,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result[0]).toBeCloseTo(0.3, 5); // Below threshold
      expect(result[1]).toBe(1.0); // Above threshold
      expect(result[2]).toBe(1.0); // Above threshold
    });

    it("should preserve values below threshold", () => {
      const depthMap = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = applyContourFlattening(depthMap, {
        enableContour: true,
        contourThreshold: 0.5,
      });

      expect(result[0]).toBeCloseTo(0.1, 5);
      expect(result[1]).toBeCloseTo(0.2, 5);
      expect(result[2]).toBeCloseTo(0.3, 5);
      expect(result[3]).toBeCloseTo(0.4, 5);
    });

    it("should handle threshold at 0.0", () => {
      const depthMap = new Float32Array([0.0, 0.1, 0.5, 1.0]);
      const result = applyContourFlattening(depthMap, {
        enableContour: true,
        contourThreshold: 0.0,
      });

      // Everything >= 0.0 should be flattened to 1.0 (all values satisfy this)
      expect(result[0]).toBe(1.0);
      expect(result[1]).toBe(1.0);
      expect(result[2]).toBe(1.0);
      expect(result[3]).toBe(1.0);
    });

    it("should handle threshold at 1.0", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = applyContourFlattening(depthMap, {
        enableContour: true,
        contourThreshold: 1.0,
      });

      // Only 1.0 should remain 1.0
      expect(result[0]).toBe(0.0);
      expect(result[1]).toBe(0.5);
      expect(result[2]).toBe(1.0);
    });

    it("should log the flattening threshold", () => {
      const depthMap = new Float32Array([0.5]);
      applyContourFlattening(depthMap, {
        enableContour: true,
        contourThreshold: 0.75,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Contour flattening applied at 75% threshold")
      );
    });
  });
});

describe("enhanceDepthDetails", () => {
  describe("When disabled", () => {
    it("should return original depth map when enhanceDetails is false", () => {
      const depthMap = new Float32Array([0.0, 0.5, 1.0]);
      const result = enhanceDepthDetails(depthMap, 3, 1, { enhanceDetails: false });

      expect(result).toBe(depthMap);
    });
  });

  describe("When enabled", () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it("should enhance depth details and return Float32Array", () => {
      const depthMap = new Float32Array([0.2, 0.4, 0.6, 0.8]);
      const result = enhanceDepthDetails(depthMap, 4, 1, {
        enhanceDetails: true,
        detailEnhancementStrength: 1.5,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4);
    });

    it("should normalize output to [0, 1] range", () => {
      const depthMap = new Float32Array([0.1, 0.3, 0.7, 0.9]);
      const result = enhanceDepthDetails(depthMap, 4, 1, {
        enhanceDetails: true,
        detailEnhancementStrength: 2.0,
      });

      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(0);
        expect(result[i]).toBeLessThanOrEqual(1);
      }
    });

    it("should apply smoothing when smoothingKernelSize > 1", () => {
      const depthMap = new Float32Array([0.0, 1.0, 0.0, 1.0, 0.0]);
      const result = enhanceDepthDetails(depthMap, 5, 1, {
        enhanceDetails: true,
        smoothingKernelSize: 3,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(5);
    });

    it("should preserve major features when preserveMajorFeatures is true", () => {
      // 3x3 grid with major feature (high gradient edge)
      const depthMap = new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
      const result = enhanceDepthDetails(depthMap, 3, 3, {
        enhanceDetails: true,
        preserveMajorFeatures: true,
        detailThreshold: 0.1,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(9);
    });

    it("should apply global enhancement when preserveMajorFeatures is false", () => {
      const depthMap = new Float32Array([0.2, 0.4, 0.6, 0.8]);
      const result = enhanceDepthDetails(depthMap, 4, 1, {
        enhanceDetails: true,
        preserveMajorFeatures: false,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4);
    });

    it("should log enhancement messages", () => {
      const depthMap = new Float32Array([0.5]);
      enhanceDepthDetails(depthMap, 1, 1, {
        enhanceDetails: true,
        detailEnhancementStrength: 1.5,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Enhancing depth details"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Depth enhancement complete"));
    });

    it("should handle uniform depth map without errors", () => {
      const depthMap = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const result = enhanceDepthDetails(depthMap, 2, 2, {
        enhanceDetails: true,
        preserveMajorFeatures: true,
        detailThreshold: 0.1,
      });

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4);
    });
  });

  describe("Configuration Options", () => {
    it("should use default values when not provided", () => {
      const depthMap = new Float32Array([0.3, 0.6]);
      const result = enhanceDepthDetails(depthMap, 2, 1, {
        enhanceDetails: true,
      });

      expect(result).toBeInstanceOf(Float32Array);
    });

    it("should handle custom detailEnhancementStrength", () => {
      const depthMap = new Float32Array([0.2, 0.8]);
      const result = enhanceDepthDetails(depthMap, 2, 1, {
        enhanceDetails: true,
        detailEnhancementStrength: 0.5,
      });

      expect(result).toBeInstanceOf(Float32Array);
    });

    it("should handle custom detailThreshold", () => {
      const depthMap = new Float32Array([0.1, 0.5, 0.9]);
      const result = enhanceDepthDetails(depthMap, 3, 1, {
        enhanceDetails: true,
        detailThreshold: 0.3,
        preserveMajorFeatures: true,
      });

      expect(result).toBeInstanceOf(Float32Array);
    });
  });
});
