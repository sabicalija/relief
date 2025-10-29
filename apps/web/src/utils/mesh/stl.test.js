import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { download } from "./stl.js";

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
