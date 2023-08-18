
// noinspection JSUnusedGlobalSymbols

export interface SignedRequestOptions {
  digestHeader: string
  tokenHeader: string
  // stores pairs access-token --> secret
  accessTokens: Record<string, string>
  algorithm: string
}

export const signedRequest: SignedRequestOptions = {
  digestHeader: 'x-digest',
  tokenHeader: 'x-access-token',
  algorithm: 'sha256',
  accessTokens: {
    'cNZ8SaZQWukJEpWV3C7Sq5XYCRvp89uK': 'lbFQ90hy620l2jU5w3s5bJesgYBp2MoOLJVT4l6OmxxPb84W4PgV3uI1Blx6Lnpo'
  }
}
