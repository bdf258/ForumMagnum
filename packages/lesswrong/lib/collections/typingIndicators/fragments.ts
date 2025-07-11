import { gql } from "@/lib/generated/gql-codegen";

export const TypingIndicatorInfo = gql(`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`)
