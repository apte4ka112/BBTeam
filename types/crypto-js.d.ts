declare module 'crypto-js' {
  export const SHA256: (data: string | WordArray) => WordArray
  export const HmacSHA256: (data: string | WordArray, secret: string | WordArray) => WordArray
  export const enc: {
    Hex: {
      stringify(wordArray: WordArray): string
    },
    Base64: {
      stringify(wordArray: WordArray): string
    },
    Utf8: {
      parse(str: string): WordArray
    }
  }

  interface WordArray {
    toString(encoder?: any): string
  }
}
