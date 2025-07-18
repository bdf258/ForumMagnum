import { gql } from "@/lib/generated/gql-codegen";

export const FeedPostFragment = gql(`
  fragment FeedPostFragment on FeedPost {
    _id
    postMetaInfo
    post {
      ...PostsListWithVotes
    }
  }
`)

export const FeedCommentThreadFragment = gql(`
  fragment FeedCommentThreadFragment on FeedCommentThread {
    _id
    commentMetaInfos
    comments {
      ...UltraFeedComment
    }
  }
`)

export const FeedSpotlightFragment = gql(`
  fragment FeedSpotlightFragment on FeedSpotlightItem {
    _id
    spotlight {
      ...SpotlightDisplay
    }
  }
`)

