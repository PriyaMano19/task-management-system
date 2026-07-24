import tokenService from "./token.service";

let logoutHandler: (() => void) | null = null;

export const registerLogoutHandler = (
  handler: () => void
) => {
  logoutHandler = handler;
};

export const logoutUser = () => {
  tokenService.clearTokens();

  if (logoutHandler) {
    logoutHandler();
  }

  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
};