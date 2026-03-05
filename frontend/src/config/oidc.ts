export const cognitoAuthConfig = {
  authority:
    process.env.NEXT_PUBLIC_COGNITO_AUTHORITY ||
    'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_BhRPdpicz',
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '1h43m87chpee1h21hu8cqdhod6',
  redirect_uri:
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  response_type: 'code',
  scope: process.env.NEXT_PUBLIC_COGNITO_SCOPE || 'email openid phone',
};

export const cognitoDomain =
  process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
  'https://ap-southeast-1bhrpdpicz.auth.ap-southeast-1.amazoncognito.com';

export const cognitoLogoutUri =
  process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI || 'http://localhost:3000';
