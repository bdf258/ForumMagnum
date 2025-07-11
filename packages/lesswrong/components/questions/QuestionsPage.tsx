import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser'
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { TupleSet } from '@/lib/utils/typeGuardUtils';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "../posts/PostsList2";
import SectionButton from "../common/SectionButton";
import LWTooltip from "../common/LWTooltip";

const includeRelatedQuestionsParam = new TupleSet(['true', 'false'] as const);

const QuestionsPage = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const includeRelatedQuestions = includeRelatedQuestionsParam.has(query.includeRelatedQuestions)
    ? query.includeRelatedQuestions
    : 'false';

  const topQuestionsTerms = {
    view: 'topQuestions',
    limit: 5,
  } as const;

  const recentActivityTerms = {
    view: 'recentQuestionActivity',
    limit: 12,
    includeRelatedQuestions
  } as const;

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Top Questions"/>
        <PostsList2 terms={topQuestionsTerms}>
          <LWTooltip title="View all questions, sorted by karma">
            <Link to={"/allPosts?filter=questions&sortedBy=top&timeframe=allTime"}>View All Top Questions</Link>
          </LWTooltip>
        </PostsList2>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Recent Activity">
          {currentUser && <Link to={'/newPost?question=true'}>
            <SectionButton>
              <AddBoxIcon />
              New Question
            </SectionButton>
          </Link>}
        </SectionTitle>
        <PostsList2 terms={recentActivityTerms}>
          <LWTooltip title="View all questions, sorted by 'newest first'">
            <Link to={"/allPosts?filter=questions&sortedBy=new&timeframe=allTime"}>View All Questions</Link>
          </LWTooltip>
        </PostsList2>
      </SingleColumnSection>
    </div>
  )
}

export default registerComponent('QuestionsPage', QuestionsPage);



