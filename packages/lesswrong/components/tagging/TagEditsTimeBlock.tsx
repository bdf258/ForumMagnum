import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import withErrorBoundary from '../common/withErrorBoundary'
import { taggingNameCapitalSetting, taggingNameIsSet } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';
import ContentType from "../posts/PostsPage/ContentType";
import SingleLineTagUpdates from "./SingleLineTagUpdates";
import LoadMore from "../common/LoadMore";
import { withDateFields } from '@/lib/utils/dateUtils';

const INITIAL_LIMIT = 5

const styles = (_: ThemeType) => ({
  subtitle: {
    marginTop: isFriendlyUI ? 20 : 6,
    marginBottom: 6
  },
});

const TagEditsTimeBlock = ({before, after, reportEmpty, classes}: {
  before: Date,
  after: Date,
  reportEmpty: () => void,
  classes: ClassesType<typeof styles>
}) => {
  // TODO: see if we can use a fragment other than TagHistoryFragment to avoid fetching the ToC or other expensive stuff
  const { data, loading } = useQuery(gql(`
    query getTagUpdates($before: Date!, $after: Date!) {
      TagUpdatesInTimeBlock(before: $before, after: $after) {
        tag {
          ...TagHistoryFragment
        }
        revisionIds
        commentCount
        commentIds
        lastRevisedAt
        lastCommentedAt
        added
        removed
        users {
          ...UsersMinimumInfo
        }
        documentDeletions {
          userId
          documentId
          netChange
          type
          docFields {
            _id
            slug
            tabTitle
            tabSubtitle
          }
          createdAt
        }
      }
    }
  `), {
    variables: {
      before, after,
    },
    ssr: true,
  });
  
  useEffect(() => {
    if (!loading && !data?.TagUpdatesInTimeBlock?.length) {
      reportEmpty();
    }
  }, [loading, data, reportEmpty]);
  const [expanded, setExpanded] = useState(false)
  
  let tagUpdatesInTimeBlock = [...(data?.TagUpdatesInTimeBlock || [])]
    .sort((update1, update2) => {
      if ((update1.added ?? 0) > (update2.added ?? 0)) return -1
      if ((update2.added ?? 0) > (update1.added ?? 0)) return 1
      return 0
    })
  if (!expanded) {
    tagUpdatesInTimeBlock = tagUpdatesInTimeBlock.slice(0, INITIAL_LIMIT)
  }
  
  if (!data?.TagUpdatesInTimeBlock?.length)
    return null;
  return <div>
    <div className={classes.subtitle}>
      <ContentType
        type="tags"
        label={`${taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Wiki/Tag'} Page Edits and Discussion`}
      />
    </div>
    {tagUpdatesInTimeBlock.map(tagUpdates => <SingleLineTagUpdates
      key={tagUpdates.tag._id}
      tag={tagUpdates.tag}
      revisionIds={tagUpdates.revisionIds}
      commentIds={tagUpdates.commentIds}
      users={tagUpdates.users}
      commentCount={tagUpdates.commentCount}
      changeMetrics={{added: tagUpdates.added, removed: tagUpdates.removed}}
      documentDeletions={tagUpdates.documentDeletions.map(documentDeletion => withDateFields(documentDeletion, ['createdAt']))}
    />)}
    {!expanded && tagUpdatesInTimeBlock.length >= INITIAL_LIMIT && <LoadMore
      loadMore={() => setExpanded(true)}
      count={tagUpdatesInTimeBlock.length}
      totalCount={data.TagUpdatesInTimeBlock.length}
    />}
  </div>
}

export default registerComponent('TagEditsTimeBlock', TagEditsTimeBlock, {
  styles, hocs: [withErrorBoundary]
});


