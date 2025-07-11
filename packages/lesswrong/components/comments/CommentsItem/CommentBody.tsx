import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'
import { useCurrentUser } from '../../common/withUser'
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import ContentStyles, { ContentStyleType } from '../../common/ContentStyles';
import { VotingProps } from '../../votes/votingProps';
import { ContentItemBody } from '../../contents/ContentItemBody';
import { type ContentItemBodyImperative, type ContentReplacedSubstringComponentInfo } from '../../contents/contentBodyUtil';

import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import CommentDeletedMetadata from "./CommentDeletedMetadata";
import InlineReactSelectionWrapper from "../../votes/lwReactions/InlineReactSelectionWrapper";

const styles = (theme: ThemeType) => ({
  commentStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
  },
  answerStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
    '& .read-more-button a, & .read-more-button a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    },
    marginBottom: ".5em"
  },
  root: {
    position: "relative",
    '& .read-more-button': {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    }
  },
  retracted: {
    textDecoration: "line-through",
  },
})

const CommentBody = ({
  comment,
  commentBodyRef,
  collapsed,
  truncated,
  postPage,
  voteProps,
  className,
  classes,
}: {
  comment: CommentsList,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative|null>|null,
  collapsed?: boolean,
  truncated?: boolean,
  postPage?: boolean,
  voteProps?: VotingProps<VoteableTypeClient>
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { html = "" } = comment.contents || {}

  const bodyClasses = classNames(
    className,
    !comment.answer && classes.commentStyling,
    comment.answer && classes.answerStyling,
    comment.retracted && classes.retracted,
  );

  if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
  if (collapsed) { return null }

  const innerHtml = truncated ? commentExcerptFromHTML(comment, currentUser, postPage) : (html ?? '')

  let contentType: ContentStyleType;
  if (comment.answer) {
    contentType = 'answer';
  } else if (comment.debateResponse) {
    contentType = 'debateResponse';
  } else {
    contentType = 'comment';
  }
  
  const votingSystem = getVotingSystemByName(comment.votingSystem);
  let highlights: ContentReplacedSubstringComponentInfo[]|undefined = undefined;
  if (voteProps && votingSystem.getCommentHighlights) {
    highlights = votingSystem.getCommentHighlights({comment, voteProps});
  }

  const contentBody = <ContentStyles contentType={contentType} className={classes.root}>
    <ContentItemBody
      ref={commentBodyRef ?? undefined}
      className={bodyClasses}
      dangerouslySetInnerHTML={{__html: innerHtml }}
      description={`comment ${comment._id}`}
      nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
      replacedSubstrings={highlights}
      contentStyleType={contentType}
    />
  </ContentStyles>

  if (votingSystem.hasInlineReacts && voteProps) {
    return <InlineReactSelectionWrapper contentRef={commentBodyRef} voteProps={voteProps} styling="comment" >
      {contentBody}
    </InlineReactSelectionWrapper>
  } else {
    return contentBody
  }
}

export default registerComponent('CommentBody', CommentBody, {styles});



