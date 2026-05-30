import { describe, expect, it } from "vitest";
import { cloudinaryFetch, exerciseCardImage } from "./cloudinary";

const GH = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/0.jpg";

describe("cloudinaryFetch", () => {
  it("wraps a remote URL with f_auto/q_auto optimization", () => {
    const url = cloudinaryFetch(GH);
    expect(url).toContain("/image/fetch/");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
    expect(url).toContain(encodeURI(GH));
  });

  it("adds sizing and fill crop with gravity when dimensions are given", () => {
    const url = cloudinaryFetch(GH, { width: 640, height: 480 });
    expect(url).toContain("w_640");
    expect(url).toContain("h_480");
    expect(url).toContain("c_fill");
    expect(url).toContain("g_auto");
  });

  it("does not double-wrap an existing Cloudinary URL", () => {
    const already = "https://res.cloudinary.com/demo/image/fetch/f_auto/" + GH;
    expect(cloudinaryFetch(already)).toBe(already);
  });

  it("returns the input untouched for empty or non-http values", () => {
    expect(cloudinaryFetch("")).toBe("");
    expect(cloudinaryFetch(null)).toBe("");
    expect(cloudinaryFetch("not-a-url")).toBe("not-a-url");
  });
});

describe("exerciseCardImage", () => {
  it("optimizes the first usable image at card size", () => {
    const url = exerciseCardImage(["", "  ", GH]);
    expect(url).toContain("/image/fetch/");
    expect(url).toContain("w_640");
    expect(url).toContain(encodeURI(GH));
  });

  it("returns empty string when there are no images", () => {
    expect(exerciseCardImage([])).toBe("");
    expect(exerciseCardImage(null)).toBe("");
    expect(exerciseCardImage(["", "   "])).toBe("");
  });
});
