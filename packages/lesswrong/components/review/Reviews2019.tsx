import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "../posts/PostsList2";
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import RecentComments from "../comments/RecentComments";
import LWTooltip from "../common/LWTooltip";
import { MenuItem } from "../common/Menus";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const UsersCurrentUpdateMutation = gql(`
  mutation updateUserReviews2019($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  settings: {
    marginLeft: theme.spacing.unit*2,
    marginRight: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
      alignItems: "flex-end"
    }
  }
})

const Reviews2019 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [expandUnread, setExpandUnread] = useState(!!(currentUser ? !currentUser.noExpandUnreadCommentsReview : true));
  const [sortNominatedPosts, setSortNominatedPosts] = useState("fewestReviews")
  const [sortReviews, setSortReviews] = useState<CommentSortingMode>("new")
  const [sortNominations, setSortNominations] = useState<CommentSortingMode>("top")

  const [updateUser] = useMutation(UsersCurrentUpdateMutation);
  const handleSetExpandUnread = () => {
    if (currentUser) {
      void updateUser({
        variables: {
          selector: { _id: currentUser._id },
          data: {
            noExpandUnreadCommentsReview: expandUnread,
          }
        }
      });
    }
    setExpandUnread(!expandUnread)
  }

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2019 Review"/>
        <div className={classes.settings}>
          <LWTooltip title="If checked, posts with unread comments will be sorted first" placement="top">
            <SectionFooterCheckbox
              onClick={handleSetExpandUnread}
              value={expandUnread}
              label={<div>Expand Unread Comments</div>}
            />
          </LWTooltip>
          <Select
            value={sortNominatedPosts}
            onChange={(e)=>setSortNominatedPosts(e.target.value)}
            disableUnderline
          >
            <MenuItem value={'fewestReviews'}>Sort by Fewest Reviews</MenuItem>
            <MenuItem value={'mostReviews'}>Sort by Most Reviews</MenuItem>
            <MenuItem value={'lastCommentedAt'}>Sort by Last Commented At</MenuItem>
          </Select>
        </div>
        <PostsList2 
          terms={{view:"reviews2019", limit: 100}} 
          showNominationCount
          showReviewCount
          showPostedAt={false}
          topLoading
          dense
          defaultToShowUnreadComments={expandUnread}
          enableTotal
        />
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Reviews">
          <Select
            value={sortReviews}
            onChange={(e)=>setSortReviews(e.target.value as CommentSortingMode)}
            disableUnderline
            >
            <MenuItem value={'top'}>Sorted by Top</MenuItem>
            <MenuItem value={'new'}>Sorted by New</MenuItem>
            <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
          </Select>
        </SectionTitle>
        <RecentComments terms={{ view: "reviews2019", sortBy: sortReviews}} truncated/>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Nominations">
          <Select
            value={sortNominations}
            onChange={(e)=>setSortNominations(e.target.value as CommentSortingMode)}
            disableUnderline
            >
            <MenuItem value={'top'}>Sorted by Top</MenuItem>
            <MenuItem value={'new'}>Sorted by New</MenuItem>
            <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
          </Select>
        </SectionTitle>
        <RecentComments terms={{ view: "nominations2019", sortBy: sortNominations}} truncated/>
      </SingleColumnSection>
    </div>
  )
}

export default registerComponent('Reviews2019', Reviews2019, {styles});



