import type { Response, CookieOptions } from "express";

const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions: CookieOptions = {
  ...accessCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setAccessTokenCookie = (res: Response, accessToken: string): void => {
  res.cookie("accessToken", accessToken, accessCookieOptions);
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", { ...accessCookieOptions, maxAge: undefined, });
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

export const setTwoFactorTokenCookie = (res: Response, token: string): void => {
  res.cookie("twoFactorToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 60 * 1000, // 5 minutes
  });
};

export const clearTwoFactorTokenCookie = (res: Response): void => {
  res.clearCookie("twoFactorToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};