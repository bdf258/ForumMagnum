import React, { ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import LocalGroupsItem from "./LocalGroupsItem";
import Loading from "../vulcan-core/Loading";
import PostsNoResults from "../posts/PostsNoResults";
import SectionFooter from "../common/SectionFooter";
import LoadMore from "../common/LoadMore";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { defineStyles, useStyles } from '../hooks/useStyles';

const localGroupsHomeFragmentMultiQuery = gql(`
  query multiLocalgroupLocalGroupsListQuery($selector: LocalgroupSelector, $limit: Int, $enableTotal: Boolean) {
    localgroups(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...localGroupsHomeFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('LocalGroupsList', (theme: ThemeType) => ({
  localGroups: {
    boxShadow: theme.palette.boxShadow.default,
  }
}));

const LocalGroupsList = <View extends keyof LocalgroupSelector>({view, terms, limit, children, showNoResults=true, heading}: {
  view: View,
  terms: { [k in keyof LocalgroupSelector]: LocalgroupSelector[k] }[View],
  limit?: number,
  children?: React.ReactNode,
  showNoResults?: boolean,
  heading?: string,
}) => {
  const classes = useStyles(styles);
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(localGroupsHomeFragmentMultiQuery, {
    variables: {
      selector: { [view]: terms },
      limit: limit ?? 10,
      enableTotal: false,
    },
  });

  const results = data?.localgroups?.results;

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const MaybeTitleWrapper = ({children}: { children: ReactNode }) => heading ?
    <SingleColumnSection>
      <SectionTitle title={heading} />
      {children}
    </SingleColumnSection> :
    <>{children}</>;

  if (!results && loading) return <Loading />

  // if we are given a section title/heading,
  // then we can make sure to hide it when showNoResults is false and there are no results to show
  if (!results || !results.length) {
    return showNoResults ? 
      <MaybeTitleWrapper><PostsNoResults /></MaybeTitleWrapper> :
      null
  }

  return <MaybeTitleWrapper>
    <div>
      <div className={classes.localGroups}>
        {results.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      </div>
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles/>
        { children }
      </SectionFooter>
    </div>
  </MaybeTitleWrapper>;
}

export default LocalGroupsList;
