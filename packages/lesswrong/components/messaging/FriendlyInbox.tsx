import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { conversationGetFriendlyTitle } from "../../lib/collections/conversations/helpers";
import { useDialog } from "../common/withDialog";
import type { InboxComponentProps } from "./InboxWrapper";
import { userCanDo } from "../../lib/vulcan-users/permissions";
import { useMarkConversationRead } from "../hooks/useMarkConversationRead";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import NewConversationDialog from "./NewConversationDialog";
import ConversationTitleEditForm from "./ConversationTitleEditForm";
import FriendlyInboxNavigation from "./FriendlyInboxNavigation";
import ConversationContents from "./ConversationContents";
import ForumIcon from "../common/ForumIcon";
import ConversationDetails from "./ConversationDetails";
import EAButton from "../ea-forum/EAButton";
import { useQueryWithLoadMore } from "../hooks/useQueryWithLoadMore";

const ConversationsListWithReadStatusMultiQuery = gql(`
  query multiConversationFriendlyInboxQuery($selector: ConversationSelector, $limit: Int, $enableTotal: Boolean) {
    conversations(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ConversationsListWithReadStatus
      }
      totalCount
    }
  }
`);

const ConversationsListWithReadStatusQuery = gql(`
  query FriendlyInbox($documentId: String) {
    conversation(input: { selector: { documentId: $documentId } }) {
      result {
        ...ConversationsListWithReadStatus
      }
    }
  }
`);

const MAX_WIDTH = 1100;

const styles = (theme: ThemeType) => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "24px 24px",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
      minHeight: "100%",
      height: "auto",
    },
  },
  modInboxLink: {
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    width: 'fit-content',
    padding: "12px 12px 8px 16px",
    fontWeight: 600,
  },
  backButton: {
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    width: 'fit-content',
    padding: "12px 0 0 0",
    fontWeight: 600,
    display: "none",
    // Only show on mobile
    [theme.breakpoints.down('xs')]: {
      display: "block",
    }
  },
  table: {
    minHeight: 0,
    display: "flex",
    flexDirection: "row",
    flex: 1,
    overflow: "hidden", // to simplify border radius
    border: theme.palette.border.grey200,
    borderRadius: `${theme.borderRadius.default}px ${theme.borderRadius.default}px 0px 0px`,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    [theme.breakpoints.down('xs')]: {
      border: "none",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  leftColumn: {
    flex: "0 0 360px",
    borderRight: theme.palette.border.grey200,
    maxWidth: 360,
    [theme.breakpoints.down('sm')]: {
      flex: "0 0 280px",
      maxWidth: 280,
    },
    [theme.breakpoints.down('xs')]: {
      flex: "1 1 auto",
      maxWidth: "100%",
    },
  },
  rightColumn: {
    flex: "1 1 auto",
  },
  hideColumnSm: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  navigation: {
    overflowY: "auto",
    borderBottom: theme.palette.border.grey200,
    height: "100%",
  },
  conversation: {
    overflowY: "auto",
    borderBottom: theme.palette.border.grey200,
    padding: "0px 16px",
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('xs')]: {
      padding: "0px 24px",
    },
  },
  columnHeader: {
    borderBottom: theme.palette.border.grey200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: "1.4rem",
    fontWeight: 600,
    // IMO with the icons we have it looks more centered with 11px padding on the bottom
    padding: "12px 12px 11px 16px",
  },
  headerText: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    [theme.breakpoints.down('xs')]: {
      "-webkit-line-clamp": 2,
    }
  },
  actionIcon: {
    color: theme.palette.grey[600],
    width: 32,
    height: 32,
    padding: 4,
    borderRadius: theme.borderRadius.small,
    cursor: "pointer",
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.darken08
    }
  },
  emptyState: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    margin: "auto auto",
    alignItems: "center",
    width: "fit-content",
    // The below two lines make it look more visually centered
    position: "relative",
    bottom: "10%",
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    color: theme.palette.grey[600],
  },
  emptyStateActionIcon: {
    width: 22,
    height: 22,
    marginRight: 4,
    position: "relative",
    top: -1,
  },
  emptyStateTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
  },
  emptyStateButton: {
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
  },
});

const FriendlyInbox = ({
  currentUser,
  terms,
  conversationId,
  isModInbox = false,
  classes,
}: InboxComponentProps & {
  conversationId?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const { openDialog } = useDialog();
  const { location } = useLocation();
  const navigate = useNavigate();
  const markConversationRead = useMarkConversationRead();

  const selectedConversationRef = useRef<HTMLDivElement|null>(null);

  const selectConversationCallback = useCallback(
    (conversationId: string | undefined) => {
      navigate({ ...location, pathname: `/${isModInbox ? "moderatorInbox" : "inbox"}/${conversationId}` });
    },
    [navigate, isModInbox, location]
  );

  const openNewConversationDialog = useCallback(() => {
    openDialog({
      name: "NewConversationDialog",
      contents: ({onClose}) => <NewConversationDialog
        onClose={onClose}
        isModInbox={isModInbox}
      />
    });
  }, [isModInbox, openDialog]);

  const { view, ...selectorTerms } = terms;
  const initialLimit = 500;
  const {
    data: conversationsData,
    loading: conversationsLoading,
    refetch: refetchConversations,
    loadMoreProps,
  } = useQueryWithLoadMore(ConversationsListWithReadStatusMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: initialLimit,
      enableTotal: false,
    },
  });

  const conversations = useMemo(() => conversationsData?.conversations?.results ?? [], [conversationsData?.conversations?.results]);

  // The conversationId need not appear in the sidebar (e.g. if it is a new conversation). If it does,
  // use the conversation from the list to load the title faster, if not, fetch it directly.
  const eagerSelectedConversation = useMemo(() => {
    return conversations?.find((c) => c._id === conversationId);
  }, [conversations, conversationId]);
  const { data } = useQuery(ConversationsListWithReadStatusQuery, {
    variables: { documentId: conversationId },
    skip: !conversationId,
  });
  const fetchedSelectedConversation = data?.conversation?.result;
  const selectedConversation = fetchedSelectedConversation || eagerSelectedConversation;

  const onOpenConversation = useCallback(async (conversationId: string) => {
    await markConversationRead(conversationId);
    await refetchConversations();
  }, [markConversationRead, refetchConversations]);

  useEffect(() => {
    if (fetchedSelectedConversation?._id) {
      void onOpenConversation(fetchedSelectedConversation._id);
    }
  }, [fetchedSelectedConversation, onOpenConversation]);

  const openConversationOptions = () => {
    if (!selectedConversation) return;

    openDialog({
      name: "ConversationTitleEditForm",
      contents: ({onClose}) => <ConversationTitleEditForm
        onClose={onClose}
        conversation={selectedConversation}
      />
    });
  };

  const showModeratorLink = userCanDo(currentUser, 'conversations.view.all') && !isModInbox;

  const title = selectedConversation
    ? conversationGetFriendlyTitle(selectedConversation, currentUser)
    : "No conversation selected";

  return (
    <div className={classes.root}>
      {showModeratorLink && (
        <Link to={"/moderatorInbox"} className={classes.modInboxLink}>
          Mod Inbox
        </Link>
      )}
      <div className={classes.table}>
        <div
          className={classNames(classes.column, classes.leftColumn, {
            [classes.hideColumnSm]: conversationId,
          })}
        >
          <div className={classes.columnHeader}>
            <div className={classes.headerText}>All messages</div>
            <ForumIcon onClick={openNewConversationDialog} icon="PencilSquare" className={classes.actionIcon} />
          </div>
          <div className={classes.navigation}>
            <FriendlyInboxNavigation
              conversationsResult={{
                results: conversations,
                loading: conversationsLoading,
                loadMoreProps,
              }}
              currentUser={currentUser}
              selectedConversationId={conversationId}
              setSelectedConversationId={selectConversationCallback}
            />
          </div>
        </div>
        <div
          className={classNames(classes.column, classes.rightColumn, {
            [classes.hideColumnSm]: !conversationId,
          })}
        >
          {!!selectedConversation && (
            <>
              <div className={classes.columnHeader}>
                <div className={classes.headerText}>{title}</div>
                <ForumIcon onClick={openConversationOptions} icon="EllipsisVertical" className={classes.actionIcon} />
              </div>
              <div className={classes.conversation} ref={selectedConversationRef}>
                <Link to="/inbox" className={classes.backButton}>
                  Go back to Inbox
                </Link>
                <ConversationDetails conversation={selectedConversation} hideOptions />
                <ConversationContents
                  currentUser={currentUser}
                  conversation={selectedConversation}
                  scrollRef={selectedConversationRef}
                />
              </div>
            </>
          )}
          {!conversationsLoading && !selectedConversation && (
            <div className={classes.emptyState}>
              <div>
                <ForumIcon icon="LightbulbChat" className={classes.emptyStateIcon} />
              </div>
              <div>
                <div className={classes.emptyStateTitle}>No conversation selected</div>
                <div className={classes.emptyStateSubtitle}>Connect with other users on the forum</div>
              </div>
              <EAButton onClick={openNewConversationDialog} className={classes.emptyStateButton}>
                <ForumIcon icon="PencilSquare" className={classes.emptyStateActionIcon} /> Start a new conversation
              </EAButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default registerComponent("FriendlyInbox", FriendlyInbox, { styles });


