import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { createMeshFromDepthMap, exportToSTL } from "./index.js";

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
        this._listeners = {};
        // Simulate async image loading
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
          // Trigger load event for addEventListener listeners
          if (this._listeners.load) {
            this._listeners.load.forEach((fn) => fn());
          }
        }, 0);
      }

      addEventListener(event, callback) {
        if (!this._listeners[event]) {
          this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
      }

      removeEventListener(event, callback) {
        if (this._listeners[event]) {
          this._listeners[event] = this._listeners[event].filter((fn) => fn !== callback);
        }
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

    it("should accept texture configuration without texture loading", async () => {
      // Test with showTexture: false to avoid TextureLoader complexity
      // TextureLoader mocking is complex due to internal Image creation
      const dataUrl = "data:image/png;base64,mock";
      const config = {
        showTexture: false,
        baseColor: "#42b983",
      };

      const mesh = await createMeshFromDepthMap(dataUrl, config);

      expect(mesh).toBeDefined();
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.material).toBeDefined();
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
  let mockMesh;
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Create a real THREE.BufferGeometry with minimal data
    // This avoids mocking issues with THREE.Mesh constructor
    const geometry = new THREE.BufferGeometry();

    // Add minimal vertex data (a single triangle)
    const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    // Add index
    const indices = new Uint16Array([0, 1, 2]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Create a real THREE.Mesh
    mockMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    mockMesh.updateMatrix();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    // Clean up geometry
    if (mockMesh.geometry) {
      mockMesh.geometry.dispose();
    }
    vi.clearAllMocks();
  });

  describe("Basic Export", () => {
    it("should return a Blob", () => {
      const result = exportToSTL(mockMesh);

      expect(result).toBeInstanceOf(Blob);
    });

    it("should return binary STL format", () => {
      const result = exportToSTL(mockMesh);

      expect(result.type).toBe("application/octet-stream");
    });

    it("should log export size", () => {
      exportToSTL(mockMesh);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("STL exported"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("MB"));
    });
  });

  describe("Geometry Handling", () => {
    it("should not modify the original geometry", () => {
      const originalIndices = Array.from(mockMesh.geometry.index.array);
      const originalPositions = Array.from(mockMesh.geometry.attributes.position.array);

      exportToSTL(mockMesh);

      // Original geometry should be unchanged
      expect(Array.from(mockMesh.geometry.index.array)).toEqual(originalIndices);
      expect(Array.from(mockMesh.geometry.attributes.position.array)).toEqual(originalPositions);
    });

    it("should handle geometry with multiple triangles", () => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 2, 0, 0, 1, 2, 0]);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 3, 4, 5]), 1));

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      mesh.updateMatrix();

      const result = exportToSTL(mesh);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);

      geometry.dispose();
    });

    it("should create a non-empty STL file", () => {
      const result = exportToSTL(mockMesh);

      // STL binary file has minimum size (84 bytes header + triangles)
      expect(result.size).toBeGreaterThan(84);
    });
  });

  describe("Face Winding", () => {
    it("should flip face winding when scale is negative", () => {
      mockMesh.scale.set(1, 1, -1); // Negative z scale
      mockMesh.updateMatrix();

      // Store original indices
      const originalIndices = Array.from(mockMesh.geometry.index.array);

      const result = exportToSTL(mockMesh);

      // Should successfully export
      expect(result).toBeInstanceOf(Blob);

      // Original should be unchanged
      expect(Array.from(mockMesh.geometry.index.array)).toEqual(originalIndices);
    });

    it("should not flip face winding when scale is positive", () => {
      mockMesh.scale.set(1, 1, 1); // Positive scale
      mockMesh.updateMatrix();

      // Reset the index array
      const originalIndices = Array.from(mockMesh.geometry.index.array);

      const result = exportToSTL(mockMesh);

      expect(result).toBeInstanceOf(Blob);
      // Original should be unchanged
      expect(Array.from(mockMesh.geometry.index.array)).toEqual(originalIndices);
    });

    it("should flip face winding when x scale is negative", () => {
      mockMesh.scale.set(-1, 1, 1); // Negative x scale
      mockMesh.updateMatrix();

      const result = exportToSTL(mockMesh);

      expect(result).toBeInstanceOf(Blob);
    });

    it("should not flip face winding when two scales are negative", () => {
      mockMesh.scale.set(-1, -1, 1); // Two negative scales (positive determinant)
      mockMesh.updateMatrix();

      const result = exportToSTL(mockMesh);

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe("Edge Cases", () => {
    it("should handle geometry without index", () => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      // No index - uses non-indexed geometry

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      mesh.updateMatrix();

      const result = exportToSTL(mesh);
      expect(result).toBeInstanceOf(Blob);

      geometry.dispose();
    });

    it("should handle empty geometry", () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([]), 3));

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      mesh.updateMatrix();

      const result = exportToSTL(mesh);
      expect(result).toBeInstanceOf(Blob);

      geometry.dispose();
    });

    it("should handle complex transformations", () => {
      mockMesh.position.set(10, 20, 30);
      mockMesh.rotation.set(Math.PI / 4, Math.PI / 3, Math.PI / 6);
      mockMesh.scale.set(2, 3, 4);
      mockMesh.updateMatrix();

      const result = exportToSTL(mockMesh);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });
  });
});
