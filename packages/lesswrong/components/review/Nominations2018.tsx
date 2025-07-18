import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "../posts/PostsList2";
import RecentDiscussionThreadsList from "../recentDiscussion/RecentDiscussionThreadsList";

const styles = (theme: ThemeType) => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  }
})

const Nominations2018 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [sortByMost, setSortBy] = useState(false);
  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review">
          <a className={classes.setting} onClick={() => setSortBy(!sortByMost)}>
            Sort by: {sortByMost ? "most" : "fewest"} nominations
          </a>
        </SectionTitle>
        <PostsList2 
          terms={{view:"nominations2018", sortByMost: sortByMost, limit: 50}} 
          showNominationCount
          enableTotal
        />
      </SingleColumnSection>
      <SingleColumnSection>
        {/* for the Review, it's more important to see all comments in Recent Discussion */}
        <RecentDiscussionThreadsList
          title="2018 Review Discussion"
          shortformButton={false}
          terms={{view: 'reviewRecentDiscussionThreadsList2018', limit:20}}
          commentsLimit={4}
          maxAgeHours={100} 
          af={false}
        />
      </SingleColumnSection>
    </div>
  )
}

export default registerComponent('Nominations2018', Nominations2018, {styles});



