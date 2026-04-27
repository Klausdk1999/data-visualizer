import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ImageUpload from "../image-upload";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/lib/requestHandlers", () => ({
  getImageUrl: jest.fn(() => "http://test/image.png"),
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:http://test/fake-blob");
global.URL.revokeObjectURL = jest.fn();

describe("ImageUpload", () => {
  let mockOnImageChange: jest.Mock;
  let mockOnImageDelete: jest.Mock;
  let mockImage: { onload: (() => void) | null; onerror: (() => void) | null; src: string };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnImageChange = jest.fn();
    mockOnImageDelete = jest.fn();
    mockImage = { onload: null, onerror: null, src: "" };
    (global as any).Image = jest.fn(() => mockImage);
  });

  it("renders upload zone when no entityId", () => {
    render(
      <ImageUpload entity="products" entityId={undefined} onImageChange={mockOnImageChange} />
    );

    expect(screen.getByText("dragAndDrop")).toBeInTheDocument();
    expect(screen.getByText("uploadImage")).toBeInTheDocument();
  });

  it("calls onImageChange when file is selected", () => {
    const { container } = render(
      <ImageUpload entity="products" entityId={undefined} onImageChange={mockOnImageChange} />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 });

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });

    expect(mockOnImageChange).toHaveBeenCalledWith(file);
  });

  it("rejects non-image files", () => {
    const { container } = render(
      <ImageUpload entity="products" entityId={undefined} onImageChange={mockOnImageChange} />
    );

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    Object.defineProperty(file, "size", { value: 1024 });

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });

    expect(screen.getByText("invalidFileType")).toBeInTheDocument();
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it("rejects files over 2MB", () => {
    const { container } = render(
      <ImageUpload entity="products" entityId={undefined} onImageChange={mockOnImageChange} />
    );

    const file = new File(["test"], "large.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 3 * 1024 * 1024 });

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });

    expect(screen.getByText("fileTooLarge")).toBeInTheDocument();
    expect(mockOnImageChange).not.toHaveBeenCalled();
  });

  it("shows delete button when preview exists", async () => {
    render(
      <ImageUpload
        entity="products"
        entityId={1}
        onImageChange={mockOnImageChange}
        onImageDelete={mockOnImageDelete}
      />
    );

    // Trigger the Image onload callback to simulate existing image loaded
    await waitFor(() => {
      expect(mockImage.onload).not.toBeNull();
    });
    act(() => {
      mockImage.onload!();
    });

    await waitFor(() => {
      expect(screen.getByTitle("deleteImage")).toBeInTheDocument();
    });
  });

  it("calls onImageDelete when delete clicked", async () => {
    render(
      <ImageUpload
        entity="products"
        entityId={1}
        onImageChange={mockOnImageChange}
        onImageDelete={mockOnImageDelete}
      />
    );

    await waitFor(() => {
      expect(mockImage.onload).not.toBeNull();
    });
    act(() => {
      mockImage.onload!();
    });

    await waitFor(() => {
      expect(screen.getByTitle("deleteImage")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("deleteImage"));

    expect(mockOnImageDelete).toHaveBeenCalled();
    expect(mockOnImageChange).toHaveBeenCalledWith(null);
  });
});
