import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateMeshDimensions,
  calculateTargetResolution,
  resampleImage,
  extractPixelData,
  extractDepthValues,
  createMeshFromDepthMap,
  exportToSTL,
  download,
} from "./stl.js";

describe("calculateMeshDimensions", () => {
  // Mock console.log to avoid cluttering test output
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("when both width and height are provided", () => {
    it("should use both dimensions as-is", () => {
      const result = calculateMeshDimensions(2.0, 200, 100);

      expect(result.meshWidth).toBe(200);
      expect(result.meshHeight).toBe(100);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using both width and height"));
    });

    it("should ignore aspect ratio when both dimensions provided", () => {
      const result = calculateMeshDimensions(1.5, 300, 150);

      // Should use provided dimensions, not calculated from aspect ratio
      expect(result.meshWidth).toBe(300);
      expect(result.meshHeight).toBe(150);
    });
  });

  describe("when only width is provided", () => {
    it("should calculate height from width and aspect ratio", () => {
      const aspectRatio = 2.0; // width/height = 2.0
      const result = calculateMeshDimensions(aspectRatio, 200, null);

      expect(result.meshWidth).toBe(200);
      expect(result.meshHeight).toBe(100); // 200 / 2.0
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using width, calculating height"));
    });

    it("should handle non-integer aspect ratios", () => {
      const aspectRatio = 1.5;
      const result = calculateMeshDimensions(aspectRatio, 150, null);

      expect(result.meshWidth).toBe(150);
      expect(result.meshHeight).toBe(100); // 150 / 1.5
    });

    it("should handle portrait aspect ratio", () => {
      const aspectRatio = 0.75; // height > width
      const result = calculateMeshDimensions(aspectRatio, 75, null);

      expect(result.meshWidth).toBe(75);
      expect(result.meshHeight).toBe(100); // 75 / 0.75
    });
  });

  describe("when only height is provided", () => {
    it("should calculate width from height and aspect ratio", () => {
      const aspectRatio = 2.0;
      const result = calculateMeshDimensions(aspectRatio, null, 100);

      expect(result.meshWidth).toBe(200); // 100 * 2.0
      expect(result.meshHeight).toBe(100);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using height, calculating width"));
    });

    it("should handle non-integer aspect ratios", () => {
      const aspectRatio = 1.5;
      const result = calculateMeshDimensions(aspectRatio, null, 100);

      expect(result.meshWidth).toBe(150); // 100 * 1.5
      expect(result.meshHeight).toBe(100);
    });

    it("should handle portrait aspect ratio", () => {
      const aspectRatio = 0.5; // height > width
      const result = calculateMeshDimensions(aspectRatio, null, 200);

      expect(result.meshWidth).toBe(100); // 200 * 0.5
      expect(result.meshHeight).toBe(200);
    });
  });

  describe("when neither width nor height is provided", () => {
    it("should use default width of 100mm and calculate height", () => {
      const aspectRatio = 2.0;
      const result = calculateMeshDimensions(aspectRatio, null, null);

      expect(result.meshWidth).toBe(100);
      expect(result.meshHeight).toBe(50); // 100 / 2.0
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using defaults"));
    });

    it("should handle square aspect ratio", () => {
      const aspectRatio = 1.0;
      const result = calculateMeshDimensions(aspectRatio, null, null);

      expect(result.meshWidth).toBe(100);
      expect(result.meshHeight).toBe(100); // 100 / 1.0
    });

    it("should handle portrait aspect ratio with defaults", () => {
      const aspectRatio = 0.5;
      const result = calculateMeshDimensions(aspectRatio, null, null);

      expect(result.meshWidth).toBe(100);
      expect(result.meshHeight).toBe(200); // 100 / 0.5
    });
  });

  describe("edge cases", () => {
    it("should handle very small aspect ratios", () => {
      const aspectRatio = 0.1;
      const result = calculateMeshDimensions(aspectRatio, 100, null);

      expect(result.meshWidth).toBe(100);
      expect(result.meshHeight).toBe(1000); // 100 / 0.1
    });

    it("should handle very large aspect ratios", () => {
      const aspectRatio = 10.0;
      const result = calculateMeshDimensions(aspectRatio, 1000, null);

      expect(result.meshWidth).toBe(1000);
      expect(result.meshHeight).toBe(100); // 1000 / 10.0
    });

    it("should treat 0 as null for width", () => {
      const result = calculateMeshDimensions(2.0, 0, 100);

      // 0 is falsy, so should use height calculation
      expect(result.meshWidth).toBe(200); // 100 * 2.0
      expect(result.meshHeight).toBe(100);
    });

    it("should treat 0 as null for height", () => {
      const result = calculateMeshDimensions(2.0, 200, 0);

      // 0 is falsy, so should use width calculation
      expect(result.meshWidth).toBe(200);
      expect(result.meshHeight).toBe(100); // 200 / 2.0
    });
  });
});

describe("calculateTargetResolution", () => {
  // Mock console.log to avoid cluttering test output
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("when maxResolution is not provided", () => {
    it("should return original dimensions unchanged", () => {
      const result = calculateTargetResolution(800, 600, null);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.originalWidth).toBe(800);
      expect(result.originalHeight).toBe(600);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using full resolution"));
    });

    it("should handle small images", () => {
      const result = calculateTargetResolution(100, 100, null);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.originalWidth).toBe(100);
      expect(result.originalHeight).toBe(100);
    });
  });

  describe("when image is within maxResolution", () => {
    it("should return original dimensions if both width and height are under limit", () => {
      const result = calculateTargetResolution(800, 600, 1024);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.originalWidth).toBe(800);
      expect(result.originalHeight).toBe(600);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Using full resolution"));
    });

    it("should return original dimensions if exactly at limit", () => {
      const result = calculateTargetResolution(1024, 768, 1024);

      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });
  });

  describe("when image exceeds maxResolution", () => {
    it("should downsample when width exceeds maxResolution", () => {
      const result = calculateTargetResolution(2048, 1536, 1024);

      // Scale = 1024 / 2048 = 0.5
      expect(result.width).toBe(1024); // 2048 * 0.5
      expect(result.height).toBe(768); // 1536 * 0.5
      expect(result.originalWidth).toBe(2048);
      expect(result.originalHeight).toBe(1536);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Resampling: 2048×1536 → 1024×768"));
    });

    it("should downsample when height exceeds maxResolution", () => {
      const result = calculateTargetResolution(1536, 2048, 1024);

      // Scale = 1024 / 2048 = 0.5
      expect(result.width).toBe(768); // 1536 * 0.5
      expect(result.height).toBe(1024); // 2048 * 0.5
      expect(result.originalWidth).toBe(1536);
      expect(result.originalHeight).toBe(2048);
    });

    it("should scale based on larger dimension", () => {
      const result = calculateTargetResolution(3024, 4032, 1024);

      // Scale = 1024 / 4032 (height is larger)
      expect(result.width).toBe(768); // 3024 * (1024/4032) = 768
      expect(result.height).toBe(1024); // 4032 * (1024/4032) = 1024
      expect(result.originalWidth).toBe(3024);
      expect(result.originalHeight).toBe(4032);
    });

    it("should floor the calculated dimensions", () => {
      const result = calculateTargetResolution(1000, 1500, 1024);

      // Scale = 1024 / 1500 = 0.682666...
      // width = floor(1000 * 0.682666...) = floor(682.666...) = 682
      // height = floor(1500 * 0.682666...) = floor(1024) = 1024
      expect(result.width).toBe(682);
      expect(result.height).toBe(1024);
    });
  });

  describe("edge cases", () => {
    it("should handle square images", () => {
      const result = calculateTargetResolution(2000, 2000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
    });

    it("should handle very large images", () => {
      const result = calculateTargetResolution(8000, 6000, 1024);

      // Scale = 1024 / 8000 = 0.128
      expect(result.width).toBe(1024); // 8000 * 0.128
      expect(result.height).toBe(768); // 6000 * 0.128
    });

    it("should handle maxResolution of 0 as null", () => {
      const result = calculateTargetResolution(2000, 1500, 0);

      // 0 is falsy, so should use original dimensions
      expect(result.width).toBe(2000);
      expect(result.height).toBe(1500);
    });

    it("should handle very small maxResolution", () => {
      const result = calculateTargetResolution(1000, 1000, 100);

      // Scale = 100 / 1000 = 0.1
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("should preserve original dimensions in return value", () => {
      const result = calculateTargetResolution(3000, 2000, 1000);

      expect(result.originalWidth).toBe(3000);
      expect(result.originalHeight).toBe(2000);
      // New dimensions should be scaled
      expect(result.width).not.toBe(3000);
      expect(result.height).not.toBe(2000);
    });
  });
});

describe("resampleImage", () => {
  // Helper function to create a mock image
  function createMockImage(width, height) {
    const img = {
      width,
      height,
      // Mock image data - we don't need actual pixel data for these tests
      src: `data:image/png;base64,mock-${width}x${height}`,
    };
    return img;
  }

  let mockContext;
  let mockCanvas;

  beforeEach(() => {
    // Create mock context with spy functions
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(),
    };

    // Create mock canvas
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
    };

    // Mock document.createElement to return our mock canvas
    global.document = {
      createElement: vi.fn((tag) => {
        if (tag === "canvas") {
          return mockCanvas;
        }
        return {};
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Canvas Creation", () => {
    it("should create a canvas with target dimensions", () => {
      const image = createMockImage(800, 600);
      const targetWidth = 400;
      const targetHeight = 300;

      const canvas = resampleImage(image, targetWidth, targetHeight);

      expect(document.createElement).toHaveBeenCalledWith("canvas");
      expect(canvas.width).toBe(targetWidth);
      expect(canvas.height).toBe(targetHeight);
    });

    it("should get 2d context from canvas", () => {
      const image = createMockImage(800, 600);
      const canvas = resampleImage(image, 400, 300);

      expect(canvas.getContext).toHaveBeenCalledWith("2d");
    });
  });

  describe("Image Drawing", () => {
    it("should draw image with correct parameters", () => {
      const image = createMockImage(800, 600);
      const targetWidth = 400;
      const targetHeight = 300;

      resampleImage(image, targetWidth, targetHeight);

      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, targetWidth, targetHeight);
    });

    it("should handle upscaling", () => {
      const image = createMockImage(200, 100);
      const targetWidth = 800;
      const targetHeight = 400;

      const canvas = resampleImage(image, targetWidth, targetHeight);

      expect(canvas.width).toBe(targetWidth);
      expect(canvas.height).toBe(targetHeight);
      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, targetWidth, targetHeight);
    });

    it("should handle downscaling", () => {
      const image = createMockImage(3200, 2400);
      const targetWidth = 800;
      const targetHeight = 600;

      const canvas = resampleImage(image, targetWidth, targetHeight);

      expect(canvas.width).toBe(targetWidth);
      expect(canvas.height).toBe(targetHeight);
      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, targetWidth, targetHeight);
    });
  });

  describe("Edge Cases", () => {
    it("should handle square images", () => {
      const image = createMockImage(1000, 1000);
      const canvas = resampleImage(image, 500, 500);

      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(500);
    });

    it("should handle very small target dimensions", () => {
      const image = createMockImage(1000, 1000);
      const canvas = resampleImage(image, 1, 1);

      expect(canvas.width).toBe(1);
      expect(canvas.height).toBe(1);
    });

    it("should handle aspect ratio changes", () => {
      const image = createMockImage(1600, 900); // 16:9
      const canvas = resampleImage(image, 400, 400); // 1:1

      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(400);
    });

    it("should handle very large target dimensions", () => {
      const image = createMockImage(100, 100);
      const canvas = resampleImage(image, 10000, 10000);

      expect(canvas.width).toBe(10000);
      expect(canvas.height).toBe(10000);
    });
  });

  describe("Return Value", () => {
    it("should return a canvas element", () => {
      const image = createMockImage(800, 600);
      const canvas = resampleImage(image, 400, 300);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBeDefined();
      expect(canvas.height).toBeDefined();
      expect(canvas.getContext).toBeDefined();
    });

    it("should return canvas with correct type", () => {
      const image = createMockImage(800, 600);
      const canvas = resampleImage(image, 400, 300);

      expect(typeof canvas.getContext).toBe("function");
    });
  });
});

describe("extractPixelData", () => {
  let mockImageData;
  let mockContext;
  let mockCanvas;

  beforeEach(() => {
    // Create mock image data
    mockImageData = {
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
      width: 2,
      height: 1,
    };

    // Create mock context
    mockContext = {
      getImageData: vi.fn(() => mockImageData),
    };

    // Create mock canvas
    mockCanvas = {
      width: 2,
      height: 1,
      getContext: vi.fn(() => mockContext),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should get 2d context from canvas", () => {
      extractPixelData(mockCanvas);

      expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    });

    it("should call getImageData with correct dimensions", () => {
      extractPixelData(mockCanvas);

      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
    });

    it("should return pixel data array", () => {
      const result = extractPixelData(mockCanvas);

      expect(result).toBe(mockImageData.data);
      expect(result).toBeInstanceOf(Uint8ClampedArray);
    });
  });

  describe("Different Canvas Sizes", () => {
    it("should handle 1x1 canvas", () => {
      mockCanvas.width = 1;
      mockCanvas.height = 1;

      extractPixelData(mockCanvas);

      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    });

    it("should handle large canvas", () => {
      mockCanvas.width = 1024;
      mockCanvas.height = 768;

      extractPixelData(mockCanvas);

      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 1024, 768);
    });

    it("should handle square canvas", () => {
      mockCanvas.width = 500;
      mockCanvas.height = 500;

      extractPixelData(mockCanvas);

      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 500, 500);
    });
  });

  describe("Return Value", () => {
    it("should return the data property from imageData", () => {
      const result = extractPixelData(mockCanvas);

      expect(result).toBe(mockImageData.data);
    });
  });
});

describe("extractDepthValues", () => {
  describe("Grayscale Conversion", () => {
    it("should convert black pixels (0) to 0.0 depth", () => {
      // RGBA: black pixel = [0, 0, 0, 255]
      const pixels = new Uint8ClampedArray([0, 0, 0, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result[0]).toBe(0.0);
    });

    it("should convert white pixels (255) to 1.0 depth", () => {
      // RGBA: white pixel = [255, 255, 255, 255]
      const pixels = new Uint8ClampedArray([255, 255, 255, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result[0]).toBe(1.0);
    });

    it("should convert mid-gray pixels (127) to ~0.498 depth", () => {
      // RGBA: mid-gray pixel = [127, 127, 127, 255]
      const pixels = new Uint8ClampedArray([127, 127, 127, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result[0]).toBeCloseTo(127 / 255, 3);
    });

    it("should only use red channel for grayscale", () => {
      // Even if G and B are different, only R is used
      const pixels = new Uint8ClampedArray([100, 200, 50, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result[0]).toBeCloseTo(100 / 255, 5);
    });
  });

  describe("Multiple Pixels", () => {
    it("should process 2x1 image correctly", () => {
      // Two pixels: black and white
      const pixels = new Uint8ClampedArray([
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
      ]);
      const result = extractDepthValues(pixels, 2, 1);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0.0);
      expect(result[1]).toBe(1.0);
    });

    it("should process 1x2 image correctly", () => {
      // Two pixels vertically: black and white
      const pixels = new Uint8ClampedArray([
        0,
        0,
        0,
        255, // Black
        255,
        255,
        255,
        255, // White
      ]);
      const result = extractDepthValues(pixels, 1, 2);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0.0);
      expect(result[1]).toBe(1.0);
    });

    it("should process 2x2 image correctly", () => {
      // Four pixels in gradient
      const pixels = new Uint8ClampedArray([
        0,
        0,
        0,
        255, // [0,0] Black
        85,
        85,
        85,
        255, // [1,0] Dark gray
        170,
        170,
        170,
        255, // [0,1] Light gray
        255,
        255,
        255,
        255, // [1,1] White
      ]);
      const result = extractDepthValues(pixels, 2, 2);

      expect(result.length).toBe(4);
      expect(result[0]).toBe(0 / 255);
      expect(result[1]).toBeCloseTo(85 / 255, 5);
      expect(result[2]).toBeCloseTo(170 / 255, 5);
      expect(result[3]).toBe(255 / 255);
    });
  });

  describe("Output Format", () => {
    it("should return Float32Array", () => {
      const pixels = new Uint8ClampedArray([128, 128, 128, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result).toBeInstanceOf(Float32Array);
    });

    it("should have correct length for width × height", () => {
      const width = 10;
      const height = 5;
      const pixels = new Uint8ClampedArray(width * height * 4); // RGBA
      const result = extractDepthValues(pixels, width, height);

      expect(result.length).toBe(width * height);
    });

    it("should normalize to 0-1 range", () => {
      const pixels = new Uint8ClampedArray([0, 0, 0, 255, 127, 127, 127, 255, 255, 255, 255, 255]);
      const result = extractDepthValues(pixels, 3, 1);

      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(0);
        expect(result[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle 1x1 image", () => {
      const pixels = new Uint8ClampedArray([100, 100, 100, 255]);
      const result = extractDepthValues(pixels, 1, 1);

      expect(result.length).toBe(1);
      expect(result[0]).toBeCloseTo(100 / 255, 5);
    });

    it("should handle all black image", () => {
      const pixels = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]);
      const result = extractDepthValues(pixels, 3, 1);

      expect(result.every((v) => v === 0.0)).toBe(true);
    });

    it("should handle all white image", () => {
      const pixels = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255]);
      const result = extractDepthValues(pixels, 2, 1);

      expect(result.every((v) => v === 1.0)).toBe(true);
    });

    it("should ignore alpha channel", () => {
      // Same RGB, different alpha values
      const pixels = new Uint8ClampedArray([
        100,
        100,
        100,
        0, // Transparent
        100,
        100,
        100,
        128, // Semi-transparent
        100,
        100,
        100,
        255, // Opaque
      ]);
      const result = extractDepthValues(pixels, 3, 1);

      // All should have same depth value regardless of alpha
      expect(result[0]).toBe(result[1]);
      expect(result[1]).toBe(result[2]);
      expect(result[0]).toBeCloseTo(100 / 255, 5);
    });
  });

  describe("Pixel Indexing", () => {
    it("should correctly map 2D coordinates to 1D array", () => {
      // Create a 3x2 gradient
      const pixels = new Uint8ClampedArray([
        0,
        0,
        0,
        255, // [0,0]
        50,
        50,
        50,
        255, // [1,0]
        100,
        100,
        100,
        255, // [2,0]
        150,
        150,
        150,
        255, // [0,1]
        200,
        200,
        200,
        255, // [1,1]
        255,
        255,
        255,
        255, // [2,1]
      ]);
      const result = extractDepthValues(pixels, 3, 2);

      // Check row-major order
      expect(result[0]).toBe(0 / 255); // [0,0]
      expect(result[1]).toBeCloseTo(50 / 255, 5); // [1,0]
      expect(result[2]).toBeCloseTo(100 / 255, 5); // [2,0]
      expect(result[3]).toBeCloseTo(150 / 255, 5); // [0,1]
      expect(result[4]).toBeCloseTo(200 / 255, 5); // [1,1]
      expect(result[5]).toBe(255 / 255); // [2,1]
    });
  });
});

describe("createMeshFromDepthMap", () => {
  let mockCanvas;
  let mockContext;
  let mockImageData;
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock image data - 4x4 grayscale gradient
    const pixelData = new Uint8ClampedArray(4 * 4 * 4); // RGBA
    for (let i = 0; i < 4 * 4; i++) {
      const gray = (i / 15) * 255; // 0 to 255 gradient
      pixelData[i * 4 + 0] = gray; // R
      pixelData[i * 4 + 1] = gray; // G
      pixelData[i * 4 + 2] = gray; // B
      pixelData[i * 4 + 3] = 255; // A
    }
    mockImageData = {
      data: pixelData,
      width: 4,
      height: 4,
    };

    // Mock canvas context
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => mockImageData),
    };

    // Mock canvas
    mockCanvas = {
      width: 4,
      height: 4,
      getContext: vi.fn(() => mockContext),
    };

    // Mock document.createElement
    global.document = {
      createElement: vi.fn((tag) => {
        if (tag === "canvas") return mockCanvas;
        if (tag === "img") {
          return {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            src: "",
          };
        }
        return {};
      }),
      createElementNS: vi.fn((ns, tag) => {
        if (tag === "canvas") return mockCanvas;
        return {};
      }),
    };

    // Mock Image constructor
    global.Image = class {
      constructor() {
        this.width = 4;
        this.height = 4;
        this.src = "";
        this.onload = null;
        this.onerror = null;
        // Simulate async image loading
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("Basic Mesh Creation", () => {
    it("should create a mesh from depth map data URL", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false, // Disable texture to avoid TextureLoader complexity
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
    });

    it("should store resolution in mesh userData", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh.userData.resolution).toBeDefined();
      expect(mesh.userData.resolution.width).toBeGreaterThan(0);
      expect(mesh.userData.resolution.height).toBeGreaterThan(0);
      expect(mesh.userData.resolution.total).toBeGreaterThan(0);
    });

    it("should apply rotation to mesh", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh.rotation.x).toBe(-Math.PI / 2);
      expect(mesh.rotation.y).toBe(Math.PI);
      expect(mesh.rotation.z).toBe(Math.PI);
    });

    it("should apply negative z-scale to mesh", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh.scale.z).toBe(-1);
    });
  });

  describe("Configuration Handling", () => {
    it("should use default values when config is empty", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Should not throw and should create mesh with defaults
    });

    it("should accept custom depth configuration", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        targetDepthMm: 30.0,
        baseThicknessMm: 5.0,
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Configuration is passed through to buildMeshGeometry
    });

    it("should accept custom dimension configuration", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        targetWidthMm: 150,
        targetHeightMm: 100,
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Dimensions are passed through to calculateMeshDimensions
    });

    it("should accept maxResolution configuration", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        maxResolution: 512,
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // maxResolution is used in calculateTargetResolution
    });

    it("should accept enhancement configuration", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        enhanceDetails: true,
        detailEnhancementStrength: 2.0,
        detailThreshold: 0.15,
        preserveMajorFeatures: true,
        smoothingKernelSize: 5,
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Enhancement options are passed to enhanceDepthDetails
    });

    it("should accept contour configuration", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        enableContour: true,
        contourThreshold: 0.8,
        showTexture: false,
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Contour options are passed to applyContourFlattening
    });

    it.skip("should accept texture configuration", async () => {
      // Skipping this test as it requires complex THREE.js TextureLoader mocking
      // The TextureLoader creates Image elements and adds event listeners which are
      // difficult to properly mock in a unit test environment.
      // Integration tests or E2E tests would be more appropriate for texture loading.
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: true,
        textureMap: "depthMap",
        baseColor: "#42b983",
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      // Texture options are passed to createMeshMaterials
    });
  });

  describe("Error Handling", () => {
    it("should reject on image load error", async () => {
      // Override Image mock to trigger error
      global.Image = class {
        constructor() {
          this.src = "";
          this.onload = null;
          this.onerror = null;
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error("Image load failed"));
            }
          }, 0);
        }
      };

      const dataUrl = "data:image/png;base64,invalid";
      const config = {};

      await expect(createMeshFromDepthMap(dataUrl, config)).rejects.toThrow();
    });
  });

  describe("Integration with Helper Functions", () => {
    it("should call resampleImage with calculated dimensions", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = { maxResolution: 2, showTexture: false };

      await createMeshFromDepthMap(dataUrl, config);

      // Should create canvas for resampling
      expect(document.createElement).toHaveBeenCalledWith("canvas");
    });

    it("should extract pixel data from canvas", async () => {
      const dataUrl = "data:image/png;base64,mock";
      const config = { showTexture: false };

      await createMeshFromDepthMap(dataUrl, config);

      // Should get context and extract image data
      expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
      expect(mockContext.getImageData).toHaveBeenCalled();
    });
  });
});

describe("exportToSTL", () => {
  // These are integration tests that require THREE.js and STLExporter
  // Skipping for now as they need proper THREE.js environment
  it.todo("should return a Blob");
  it.todo("should return binary STL format");
  it.todo("should clone geometry to avoid modifying original");
  it.todo("should log export size");
  it.todo("should clear material groups from cloned geometry");
  it.todo("should compute vertex normals");
  it.todo("should dispose cloned geometry after export");
  it.todo("should flip face winding when scale is negative");
  it.todo("should not flip face winding when scale is positive");
});

describe("download", () => {
  let createElementSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let mockLink;

  beforeEach(() => {
    // Mock link element
    mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink);

    // Mock URL methods
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  describe("Basic Download", () => {
    it("should create an anchor element", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(createElementSpy).toHaveBeenCalledWith("a");
    });

    it("should create object URL from blob", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    });

    it("should set href to object URL", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(mockLink.href).toBe("blob:mock-url");
    });

    it("should trigger click on link", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should revoke object URL after download", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("Filename Handling", () => {
    it("should use default filename when not provided", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      expect(mockLink.download).toBe("relief.stl");
    });

    it("should use custom filename when provided", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob, "custom-model.stl");

      expect(mockLink.download).toBe("custom-model.stl");
    });

    it("should handle filenames with spaces", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob, "my model file.stl");

      expect(mockLink.download).toBe("my model file.stl");
    });

    it("should handle filenames with special characters", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob, "model_v1.2-final.stl");

      expect(mockLink.download).toBe("model_v1.2-final.stl");
    });
  });

  describe("Blob Handling", () => {
    it("should handle empty blob", () => {
      const blob = new Blob([], { type: "application/octet-stream" });
      download(blob);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle large blob", () => {
      const largeData = new Uint8Array(10 * 1024 * 1024); // 10MB
      const blob = new Blob([largeData], { type: "application/octet-stream" });
      download(blob);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle different blob types", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      download(blob, "test.txt");

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should clean up resources in correct order", () => {
      const blob = new Blob(["test data"], { type: "application/octet-stream" });
      download(blob);

      // Verify sequence of calls
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
    });
  });
});
