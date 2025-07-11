import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentTreeNode, unflattenComments } from "../../lib/utils/unflatten";
import { Link } from "../../lib/reactRouterWrapper";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import { taggingNameCapitalSetting } from "../../lib/instanceSettings";
import type { TagCommentType } from "../../lib/collections/comments/types";
import type { CommentTreeOptions } from "../comments/commentTree";
import EARecentDiscussionItem from "./EARecentDiscussionItem";
import TagExcerpt from "../common/excerpts/TagExcerpt";
import CommentsNodeInner from "../comments/CommentsNode";
import { maybeDate } from "@/lib/utils/dateUtils";

const styles = (theme: ThemeType) => ({
  heading: {
    marginBottom: 12,
  },
  tagName: {
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  metadata: {
    marginTop: 8,
    color: theme.palette.grey[600],
  },
  excerpt: {
    marginBottom: 16,
  },
});

const EARecentDiscussionTagCommented = ({
  tag,
  comments,
  refetch,
  expandAllThreads,
  classes,
}: {
  tag: TagRecentDiscussion,
  comments: CommentsList[],
  refetch?: () => void,
  expandAllThreads?: boolean
  tagCommentType?: TagCommentType,
  classes: ClassesType<typeof styles>,
}) => {
  if (!comments.length) {
    return null;
  }

  const lastCommentId = comments[0]._id;
  const nestedComments = unflattenComments(comments);

  const treeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    highlightDate: maybeDate(tag.lastVisitedAt ?? undefined),
    refetch,
    condensed: true,
    tag,
  };

  const metadata = tag.wikiOnly
    ? "Wiki page"
    : `${taggingNameCapitalSetting.get()} page - ${tag.postCount} posts`;
  return (
    <EARecentDiscussionItem
      icon="CommentFilled"
      iconVariant="primary"
      user={comments[0].user}
      action="commented on tag"
      tag={tag}
      timestamp={maybeDate(comments[0].postedAt)}
    >
      <div className={classes.heading}>
        <Link to={tagGetUrl(tag)} className={classes.tagName}>
          {tag.name}
        </Link>
        <div className={classes.metadata}>{metadata}</div>
      </div>
      <TagExcerpt tag={tag} className={classes.excerpt} />
      {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
        <div key={comment.item._id}>
          <CommentsNodeInner
            treeOptions={treeOptions}
            startThreadTruncated={true}
            expandAllThreads={expandAllThreads}
            expandNewComments={false}
            nestingLevel={1}
            comment={comment.item}
            childComments={comment.children}
          />
        </div>
      )}
    </EARecentDiscussionItem>
  );
}

export default registerComponent(
  "EARecentDiscussionTagCommented",
  EARecentDiscussionTagCommented,
  {styles},
);


