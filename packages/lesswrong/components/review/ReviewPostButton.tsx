import React from 'react';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCommentBox } from '../hooks/useCommentBox';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import ReviewPostForm from "./ReviewPostForm";
import LoginPopup from "../users/LoginPopup";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit*1.5,
    cursor: "pointer",
    '&:hover': {
      opacity: .8
    }
  }
})

const ReviewPostButton = ({classes, post, reviewMessage="Review", year}: {
  classes: ClassesType<typeof styles>,
  post: PostsBase,
  reviewMessage?: any,
  year: string
}) => {
  const currentUser = useCurrentUser();
  const { openCommentBox } = useCommentBox();
  const { openDialog } = useDialog();

  const handleClick = () => {
    if (currentUser) {
      openCommentBox({
        commentBox: ({onClose}) => <ReviewPostForm
          onClose={onClose}
          post={post}
        />
      });
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }

  return (
    <AnalyticsContext pageElementContext="reviewPostButton">
      <span onClick={handleClick} className={classes.root}>
        {reviewMessage}
      </span>
    </AnalyticsContext>
  )
}

export default registerComponent('ReviewPostButton', ReviewPostButton, {styles});



