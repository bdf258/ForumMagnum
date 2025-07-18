import { gql } from "@/lib/generated/gql-codegen";

export const AdvisorRequestsMinimumInfo = gql(`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    interestedInMetaculus
    jobAds
  }
`)
