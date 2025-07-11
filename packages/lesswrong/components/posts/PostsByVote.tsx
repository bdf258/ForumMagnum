import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import PostsItem from "./PostsItem";
import ErrorBoundary from "../common/ErrorBoundary";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const PostsListWithVotesMultiQuery = gql(`
  query multiPostPostsByVoteQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const PostsByVote = ({postIds, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  postIds: Array<string>,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(PostsListWithVotesMultiQuery, {
    variables: {
      selector: { nominatablePostsByVote: { postIds, before, ...(year === '≤2020' ? {} : { after }) } },
      limit: limit ?? 1000,
      enableTotal: false,
    },
  });

  const posts = data?.posts?.results;

  const showLoadMore = !loadMoreProps.hidden;

  if (loading && !posts) return <div><Loading/> <Typography variant="body2">Loading Posts</Typography></div>

  if (!posts || posts.length === 0) {
    return hideEmptyStateText ? null : <Typography variant="body2">You have no upvotes from this period</Typography>
  }

  return <ErrorBoundary>
    <div>
      {posts.map(post => {
        return <PostsItem
          key={post._id}
          post={post}
          showMostValuableCheckbox={showMostValuableCheckbox}
          hideTag
          className={postItemClassName}
        />
      })}
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  </ErrorBoundary>
}

export default registerComponent("PostsByVote", PostsByVote);


