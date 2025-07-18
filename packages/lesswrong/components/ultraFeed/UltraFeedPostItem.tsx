import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo, FeedItemSourceType } from "./ultraFeedTypes";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from "./ultraFeedSettingsTypes";
import { useUltraFeedObserver } from "./UltraFeedObserver";
import { useRecordPostView } from "../hooks/useRecordPostView";
import classnames from "classnames";
import { highlightMaxChars } from "../../lib/editor/ellipsize";
import { useOverflowNav } from "./OverflowNavObserverContext";
import { useDialog } from "../common/withDialog";
import { isPostWithForeignId } from "../hooks/useForeignCrosspost";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import { Link } from "../../lib/reactRouterWrapper";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import TruncatedAuthorsList from "../posts/TruncatedAuthorsList";
import FormatDate from "../common/FormatDate";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import FeedContentBody from "./FeedContentBody";
import UltraFeedItemFooter from "./UltraFeedItemFooter";
import Loading from "../vulcan-core/Loading";
import OverflowNavButtons from "./OverflowNavButtons";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import UltraFeedPostActions from "./UltraFeedPostActions";
import BookmarksIcon from "@/lib/vendor/@material-ui/icons/src/Bookmarks";
import ClockIcon from "@/lib/vendor/@material-ui/icons/src/AccessTime";
import SubscriptionsIcon from "@/lib/vendor/@material-ui/icons/src/NotificationsNone";
import LWTooltip from "../common/LWTooltip";
import { SparkleIcon } from "../icons/sparkleIcon";
import SeeLessFeedback from "./SeeLessFeedback";
import { useCurrentUser } from "../common/withUser";
import { useSeeLess } from "./useSeeLess";

const localPostQuery = gql(`
  query LocalPostQuery($documentId: String!) {
    post(selector: { _id: $documentId }) {
      result {
        ...UltraFeedPostFragment
      }
    }
  }
`);

const foreignPostQuery = gql(`
  query ForeignPostQuery($documentId: String!) {
    post(selector: { _id: $documentId }) {
      result {
        ...PostsPage
      }
    }
  }
`);

const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    backdropFilter: theme.palette.filters.bannerAdBlurHeavy,
    borderRadius: 4,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  greyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    pointerEvents: 'none',
  },
  tripleDotMenu: {
    opacity: 0.7,
    position: 'absolute',
    right: 2,
    top: 5,
    padding: 5,
    marginLeft: 4,
    "& svg": {
      fontSize: 18,
      cursor: "pointer",
      color: theme.palette.text.dim,
    }
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: 12,
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
    },
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    color: theme.palette.text.bannerAdOverlay,
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    flexGrow: 1,
    paddingRight: 8,
    [theme.breakpoints.down('sm')]: {
      fontSize: 20.5,
    },
  },
  titleIsRead: {
    opacity: 0.5,
    color: theme.palette.text.bannerAdOverlay,
    '&:hover': {
      opacity: 0.9,
    },
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      fontSize: "1.3rem",
    },
  },
  sourceIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    color: theme.palette.grey[600],
    opacity: 0.7,
    position: 'relative',
    top: 3,
    flexShrink: 0,
  },
  metaDateContainer: {
    marginRight: 8,
  },
  footer: {
    marginTop: 12,
  },
  footerGreyedOut: {
    opacity: 0.5,
    filter: 'blur(0.5px)',
    '& > *': {
      pointerEvents: 'none',
    },
    '& .SeeLessButton-root': {
      pointerEvents: 'auto !important',
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },
  authorsList: {
    fontSize: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
    marginRight: 8,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

}));

const sourceIconMap: Array<{ source: FeedItemSourceType, icon: any, tooltip: string }> = [
  { source: 'bookmarks' as FeedItemSourceType, icon: BookmarksIcon, tooltip: "From your bookmarks" },
  { source: 'subscriptions' as FeedItemSourceType, icon: SubscriptionsIcon, tooltip: "From users you follow" },
  { source: 'recombee-lesswrong-custom' as FeedItemSourceType, icon: SparkleIcon, tooltip: "Recommended for you" },
  { source: 'hacker-news' as FeedItemSourceType, icon: ClockIcon, tooltip: "Latest posts" },
];

interface UltraFeedPostItemHeaderProps {
  post: PostsListWithVotes;
  isRead: boolean;
  handleOpenDialog: () => void;
  sources: FeedItemSourceType[];
}

const UltraFeedPostItemHeader = ({
  post,
  isRead,
  handleOpenDialog,
  sources,
}: UltraFeedPostItemHeaderProps) => {
  const classes = useStyles(styles);
  const authorListRef = useRef<HTMLDivElement>(null);

  const handleTitleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      handleOpenDialog();
    }
  };

  const sourceIcons = sourceIconMap
    .filter(({ source }) => sources.includes(source))
    .map(({ source, icon, tooltip }) => ({ icon, tooltip, key: source }));

  return (
    <div className={classes.header}>
      <div className={classes.titleContainer}>
        <a
          href={postGetPageUrl(post)}
          onClick={handleTitleClick}
          className={classnames(classes.title, { [classes.titleIsRead]: isRead })}
        >
          {post.title}
        </a>
      </div>
      <div className={classes.metaRow}>
        {sourceIcons.map((iconInfo) => (
          <LWTooltip key={iconInfo.key} title={iconInfo.tooltip} placement="top">
            <span>
              <iconInfo.icon className={classes.sourceIcon} />
            </span>
          </LWTooltip>
        ))}
        <TruncatedAuthorsList post={post} useMoreSuffix={false} expandContainer={authorListRef} className={classes.authorsList} />
        {post.postedAt && (
          <span className={classes.metaDateContainer}>
            <FormatDate date={post.postedAt} />
          </span>
        )}
      </div>
    </div>
  );
};

const calculateDisplayWordCount = (
  fullPost: PostsPage | UltraFeedPostFragment | null | undefined,
  post: PostsListWithVotes,
  displayHtml: string | undefined
): number | undefined => {
  if (fullPost?.contents?.wordCount) {
    return fullPost.contents.wordCount;
  }
  if (displayHtml === post.contents?.htmlHighlight && displayHtml) {
    return Math.floor(displayHtml.length / 5);
  }
  if (post.shortform) {
    return 0;
  }
  return post.contents?.wordCount;
};

const UltraFeedPostItem = ({
  post,
  postMetaInfo,
  index,
  showKarma,
  settings = DEFAULT_SETTINGS,
}: {
  post: PostsListWithVotes,
  postMetaInfo: FeedPostMetaInfo,
  index: number,
  showKarma?: boolean,
  settings?: UltraFeedSettingsType,
}) => {
  const classes = useStyles(styles);
  const { observe, trackExpansion } = useUltraFeedObserver();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();
  const overflowNav = useOverflowNav(elementRef);
  const { captureEvent } = useTracking();
  const { recordPostView, isRead } = useRecordPostView(post);
  const [hasRecordedViewOnExpand, setHasRecordedViewOnExpand] = useState(false);
  const isForeignCrosspost = isPostWithForeignId(post) && !post.fmCrosspost.hostedHere
  const { displaySettings } = settings;
  const apolloClient = useForeignApolloClient();
  const currentUser = useCurrentUser();
  
  const documentId = isForeignCrosspost ? (post.fmCrosspost.foreignPostId ?? undefined) : post._id;
  
  const needsFullPostInitially = displaySettings.postInitialWords > (highlightMaxChars / 5);
  const [isLoadingFull, setIsLoadingFull] = useState(isForeignCrosspost || needsFullPostInitially);
  const [resetSig, setResetSig] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  
  const {
    isSeeLessMode,
    handleSeeLess,
    handleUndoSeeLess,
    handleFeedbackChange,
  } = useSeeLess({
    documentId: post._id,
    documentType: 'post',
    recommId: postMetaInfo.recommInfo?.recommId,
  });

  const { data: localPostData, loading: loadingLocalPost } = useQuery(localPostQuery, {
    skip: isForeignCrosspost || !isLoadingFull,
    fetchPolicy: "cache-first",
    variables: {
      documentId,
    },
  });

  const localPost = localPostData?.post?.result;

  const { data: foreignPostData, loading: loadingForeignPost } = useQuery(foreignPostQuery, {
    skip: !isForeignCrosspost || !isLoadingFull,
    fetchPolicy: "cache-first",
    variables: {
      documentId,
    },
    client: apolloClient,
  });

  const foreignPost = foreignPostData?.post?.result;

  const fullPost = isForeignCrosspost ? foreignPost : localPost;
  const loadingFullPost = isForeignCrosspost ? loadingForeignPost : loadingLocalPost;

  useEffect(() => {
    const currentElement = elementRef.current;
    if (currentElement) {
      observe(currentElement, { 
        documentId: post._id, 
        documentType: 'post',
        servedEventId: postMetaInfo.servedEventId
      });
    }
  }, [observe, post._id, postMetaInfo.servedEventId]);

  const handleContentExpand = useCallback((expanded: boolean, wordCount: number) => {
    setIsContentExpanded(expanded);
    
    if (expanded && !isLoadingFull && !fullPost) {
      setIsLoadingFull(true);
    }

    trackExpansion({
      documentId: post._id,
      documentType: 'post',
      level: expanded ? 1 : 0,
      maxLevelReached: expanded,
      wordCount,
      servedEventId: postMetaInfo.servedEventId,
    });

    captureEvent("ultraFeedPostItemExpanded", {
      postId: post._id,
      expanded,
      wordCount,
    });

    if (!hasRecordedViewOnExpand) {
      void recordPostView({ post, extraEventProperties: { type: 'ultraFeedExpansion' } });
      setHasRecordedViewOnExpand(true);
    }

  }, [
    trackExpansion, 
    post, 
    captureEvent, 
    recordPostView, 
    hasRecordedViewOnExpand, 
    isLoadingFull, 
    fullPost,
    postMetaInfo.servedEventId,
  ]);

  const handleCollapse = () => {
    setResetSig((s) => s + 1);
    setIsContentExpanded(false);
  };

  const handleOpenDialog = useCallback(() => {
    captureEvent("ultraFeedPostItemTitleClicked", {postId: post._id});
    trackExpansion({
      documentId: post._id,
      documentType: 'post',
      level: 1,
      maxLevelReached: true,
      wordCount: post.contents?.wordCount ?? 0,
      servedEventId: postMetaInfo.servedEventId,
    });
    
    if (!hasRecordedViewOnExpand) {
      void recordPostView({ post, extraEventProperties: { type: 'ultraFeedExpansion' } });
      setHasRecordedViewOnExpand(true);
    }
    
    openDialog({
      name: "UltraFeedPostDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <UltraFeedPostDialog
          {...(fullPost ? { post: fullPost } : { partialPost: post })}
          postMetaInfo={postMetaInfo}
          onClose={onClose}
        />
      )
    });
  }, [
    openDialog,
    post,
    captureEvent,
    fullPost,
    trackExpansion,
    postMetaInfo,
    hasRecordedViewOnExpand,
    recordPostView,
  ]);

  const shortformHtml = post.shortform 
    ? `This is a special post for quick takes (aka "shortform"). Only the owner can create top-level comments.`
    : undefined

  const displayHtml = fullPost?.contents?.html ?? post.contents?.htmlHighlight ?? shortformHtml;
  
  // Calculate the appropriate word count based on what content we're displaying
  const displayWordCount = calculateDisplayWordCount(fullPost, post, displayHtml);

  const truncationParams = useMemo(() => {
    return {
      initialWordCount: displaySettings.postInitialWords,
      maxWordCount: displaySettings.postMaxWords
    };
  }, [displaySettings.postInitialWords, displaySettings.postMaxWords]);

  if (!displayHtml) {
    return null; 
  }

  return (
    <AnalyticsContext ultraFeedElementType="feedPost" postId={post._id} ultraFeedCardIndex={index}>
    <div className={classes.root}>
      <div ref={elementRef} className={classes.mainContent}>
        <AnalyticsContext pageElementContext="tripleDotMenu">
          <PostActionsButton
            post={post}
            vertical={true}
            autoPlace
            ActionsComponent={UltraFeedPostActions}
            className={classnames(classes.tripleDotMenu, { [classes.greyedOut]: isSeeLessMode })}
          />
        </AnalyticsContext>

        <div className={classnames({ [classes.greyedOut]: isSeeLessMode })}>
          <UltraFeedPostItemHeader
            post={post}
            isRead={isRead}
            handleOpenDialog={handleOpenDialog}
            sources={postMetaInfo.sources}
          />
        </div>

        {isSeeLessMode && (
          <SeeLessFeedback
            onUndo={handleUndoSeeLess}
            onFeedbackChange={handleFeedbackChange}
          />
        )}
        
        {!isSeeLessMode && (
          <FeedContentBody
            html={displayHtml}
            initialWordCount={truncationParams.initialWordCount}
            maxWordCount={truncationParams.maxWordCount}
            wordCount={displayWordCount ?? 200}
            nofollow={(post.user?.karma ?? 0) < nofollowKarmaThreshold.get()}
            onContinueReadingClick={handleOpenDialog}
            onExpand={handleContentExpand}
            hideSuffix={loadingFullPost}
            resetSignal={resetSig}
          />
        )}
        
        {/* Show loading indicator below content if we're loading the full post */}
        {loadingFullPost && displayHtml && !isSeeLessMode && (
          <div className={classes.loadingContainer}>
            <Loading />
          </div>
        )}

        <UltraFeedItemFooter 
          document={post} 
          collectionName="Posts" 
          metaInfo={postMetaInfo} 
          className={classnames(classes.footer, { [classes.footerGreyedOut]: isSeeLessMode })}
          onSeeLess={isSeeLessMode ? handleUndoSeeLess : handleSeeLess}
          isSeeLessMode={isSeeLessMode}
        />
      </div>
      
      {(overflowNav.showUp || overflowNav.showDown) && <OverflowNavButtons nav={overflowNav} onCollapse={isContentExpanded ? handleCollapse : undefined} />}
    </div>
    </AnalyticsContext>
  );
};

export default registerComponent("UltraFeedPostItem", UltraFeedPostItem);



 
