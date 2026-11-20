import { describe, expect, it } from "vitest";

import { parsePageParam } from "@/lib/page-param";

describe("parsePageParam", () => {
  it("menerima bilangan bulat positif", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("15")).toBe(15);
  });

  it("menolak desimal, eksponen, dan sisipan", () => {
    expect(parsePageParam("2.2")).toBe(1);
    expect(parsePageParam("2e2")).toBe(1);
    expect(parsePageParam("2abc")).toBe(1);
    expect(parsePageParam("Infinity")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
    expect(parsePageParam("01")).toBe(1);
    expect(parsePageParam(" 2")).toBe(1);
    expect(parsePageParam("")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("memakai nilai pertama bila parameter berulang, dan membatasi offset", () => {
    expect(parsePageParam(["4", "2.2"])).toBe(4);
    expect(parsePageParam("999999999999999999")).toBe(1);
    expect(parsePageParam("10001")).toBe(1);
    expect(parsePageParam("3", 1, 5)).toBe(3);
    expect(parsePageParam("9", 1, 5)).toBe(1);
  });
});
