import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID as string,
    authority: "https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signup_signin",
    knownAuthorities: ["yourtenant.b2clogin.com"],
    redirectUri: window.location.origin,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export async function login() {
  await msalInstance.loginRedirect();
}

export async function logout() {
  await msalInstance.logoutRedirect();
}

export async function getToken() {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;
  const request = {
    scopes: ["api://your-api/.default"],
    account: accounts[0],
  };
  const response = await msalInstance.acquireTokenSilent(request);
  return response.accessToken;
}

export function getUser() {
  const accounts = msalInstance.getAllAccounts();
  return accounts[0];
}
