import { gql } from "@/lib/generated/gql-codegen";

export const UsersMinimumInfo = gql(`
  fragment UsersMinimumInfo on User {
    _id
    slug
    createdAt
    username
    displayName
    profileImageId
    previousDisplayName
    fullName
    karma
    afKarma
    deleted
    isAdmin
    htmlBio
    jobTitle
    organization
    postCount
    commentCount
    sequenceCount
    afPostCount
    afCommentCount
    spamRiskScore
    tagRevisionCount
    reviewedByUserId
  }
`)

export const UsersProfile = gql(`
  fragment UsersProfile on User {
    ...UsersMinimumInfo
    oldSlugs
    groups
    jobTitle
    organization
    careerStage
    biography {
      ...RevisionDisplay
    }
    howOthersCanHelpMe {
      ...RevisionDisplay
    }
    howICanHelpOthers {
      ...RevisionDisplay
    }
    profileTagIds
    profileTags {
      ...TagPreviewFragment
    }
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    website
    linkedinProfileURL
    facebookProfileURL
    blueskyProfileURL
    twitterProfileURL
    githubProfileURL
    frontpagePostCount
    afSequenceCount
    afSequenceDraftCount
    sequenceDraftCount
    moderationStyle
    moderationGuidelines {
      ...RevisionDisplay
    }
    bannedUserIds
    location
    googleLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    mongoLocation
    shortformFeedId
    viewUnreviewedComments
    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    petrovPressedButtonDate
    petrovOptOut
    sortDraftsBy
    email
    emails
    banned
    ...SharedUserBooleans
    noindex
    paymentEmail
    paymentInfo
    goodHeartTokens
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
  }
`)

export const UsersCurrent = gql(`
  fragment UsersCurrent on User {
    ...UsersProfile

    beta
    email
    services
    acceptedTos
    pageUrl
    banned
    isReviewed
    nullifyVotes
    hideIntercom
    hideNavigationSidebar
    hideCommunitySection
    expandedFrontpageSections {
      community
      recommendations
      quickTakes
      quickTakesCommunity
      popularComments
    }
    hidePostsRecommendations
    currentFrontpageFilter
    frontpageSelectedTab
    frontpageFilterSettings
    hideFrontpageFilterSettingsDesktop
    allPostsTimeframe
    allPostsSorting
    allPostsFilter
    allPostsShowLowKarma
    allPostsIncludeEvents
    allPostsHideCommunity
    allPostsOpenSettings
    draftsListSorting
    draftsListShowArchived
    draftsListShowShared
    lastNotificationsCheck
    bannedUserIds
    bannedPersonalUserIds
    moderationStyle
    noKibitz
    showHideKarmaOption
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    commentSorting
    location
    googleLocation
    mongoLocation
    mapLocation
    mapLocationSet
    mapMarkerText
    htmlMapMarkerText
    nearbyEventsNotifications
    nearbyEventsNotificationsLocation
    nearbyEventsNotificationsRadius
    nearbyPeopleNotificationThreshold
    hideFrontpageMap
    emailSubscribedToCurated
    subscribedToDigest
    subscribedToNewsletter
    unsubscribeFromAll
    emails
    whenConfirmationEmailSent
    hideSubscribePoke
    hideMeetupsPoke
    hideHomeRHS
    noCollapseCommentsFrontpage
    noCollapseCommentsPosts
    noSingleLineComments
    showCommunityInRecentDiscussion
    karmaChangeNotifierSettings
    karmaChangeLastOpened
    shortformFeedId
    viewUnreviewedComments
    recommendationSettings
    theme

    bookmarkedPostsMetadata {
      postId
    }

    hiddenPostsMetadata {
      postId
    }

    auto_subscribe_to_my_posts
    auto_subscribe_to_my_comments
    autoSubscribeAsOrganizer
    noExpandUnreadCommentsReview
    reviewVotesQuadratic
    reviewVotesQuadratic2019
    reviewVotesQuadratic2020
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2019Ad

    abTestKey
    abTestOverrides

    sortDraftsBy
    reactPaletteStyle

    petrovPressedButtonDate
    petrovLaunchCodeDate
    petrovOptOut
    lastUsedTimezone
    ...SharedUserBooleans

    acknowledgedNewUserGuidelines
    notificationSubforumUnread
    subforumPreferredLayout
    
    hideJobAdUntil
    criticismTipsDismissed
    
    allowDatadogSessionReplay
    hideFrontpageBook2020Ad

    hideDialogueFacilitation
    optedInToDialogueFacilitation
    revealChecksToAdmins
    notificationNewDialogueChecks
    notificationYourTurnMatchForm

    showDialoguesList
    showMyDialogues
    showMatches
    showRecommendedPartners
    hideActiveDialogueUsers

    hideSunshineSidebar
    optedOutOfSurveys
    postGlossariesPinned
    generateJargonForDrafts
    generateJargonForPublishedPosts
  }
`)

/**
 * Fragment containing rate-limit information (ie, whether the user is rate limited and when
 * they're next eligible to comment). Separated from `UsersCurrent` because figuring that out can
 * involve some DB queries that we don't want to have to finish in serial before the rest of the
 * page can start loading.
 */
export const UsersCurrentCommentRateLimit = gql(`
  fragment UsersCurrentCommentRateLimit on User {
    _id
    rateLimitNextAbleToComment(postId: $postId)
  }
`)

export const UsersCurrentPostRateLimit = gql(`
  fragment UsersCurrentPostRateLimit on User {
    _id
    rateLimitNextAbleToPost(eventForm: $eventForm)
  }
`)

export const UserBookmarkedPosts = gql(`
  fragment UserBookmarkedPosts on User {
    _id
    bookmarkedPosts {
      ...PostsList
    }
  }
`)

export const UserKarmaChanges = gql(`
  fragment UserKarmaChanges on User {
    _id
    karmaChanges {
      totalChange
      updateFrequency
      startDate
      endDate
      nextBatchDate
      posts {
        _id
        scoreChange
        postId
        title
        slug
        addedReacts {
          reactionType
          userId
        }
        eaAddedReacts
        collectionName
      }
      comments {
        _id
        scoreChange
        commentId
        description
        postId
        postTitle
        postSlug
        tagSlug
        tagName
        tagCommentType
        addedReacts {
          reactionType
          userId
        }
        eaAddedReacts
        collectionName
      }
      tagRevisions {
        _id
        scoreChange
        tagId
        tagSlug
        tagName
        addedReacts {
          reactionType
          userId
        }
        eaAddedReacts
        collectionName
      }
      todaysKarmaChanges {
        posts {
          _id
          scoreChange
          postId
          title
          slug
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
        comments {
          _id
          scoreChange
          commentId
          description
          postId
          postTitle
          postSlug
          tagSlug
          tagName
          tagCommentType
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
        tagRevisions {
          _id
          scoreChange
          tagId
          tagSlug
          tagName
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
      }
      thisWeeksKarmaChanges {
        posts {
          _id
          scoreChange
          postId
          title
          slug
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
        comments {
          _id
          scoreChange
          commentId
          description
          postId
          postTitle
          postSlug
          tagSlug
          tagName
          tagCommentType
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
        tagRevisions {
          _id
          scoreChange
          tagId
          tagSlug
          tagName
          addedReacts {
            reactionType
            userId
          }
          eaAddedReacts
          collectionName
        }
      }
    }
  }
`)

export const UsersBannedFromUsersModerationLog = gql(`
  fragment UsersBannedFromUsersModerationLog on User {
    _id
    slug
    displayName
    bannedUserIds
    bannedPersonalUserIds
  }
`)

export const SunshineUsersList = gql(`
  fragment SunshineUsersList on User {
    ...UsersMinimumInfo
    karma
    htmlBio
    website
    createdAt
    email
    emails
    commentCount
    maxCommentCount
    postCount
    maxPostCount
    voteCount
    smallUpvoteCount
    bigUpvoteCount
    smallDownvoteCount
    bigDownvoteCount
    banned
    reviewedByUserId
    reviewedAt
    signUpReCaptchaRating
    mapLocation
    needsReview
    sunshineNotes
    sunshineFlagged
    postingDisabled
    allCommentingDisabled
    commentingOnOtherUsersDisabled
    conversationsDisabled
    snoozedUntilContentCount
    nullifyVotes
    deleteContent
    
    moderatorActions {
      ...ModeratorActionDisplay
    }
    usersContactedBeforeReview
    associatedClientIds {
      clientId
      firstSeenReferrer
      firstSeenLandingPage
      userIds
    }
    altAccountsDetected

    voteReceivedCount
    smallUpvoteReceivedCount
    bigUpvoteReceivedCount
    smallDownvoteReceivedCount
    bigDownvoteReceivedCount

    recentKarmaInfo
    lastNotificationsCheck
  }
`)

export const UserAltAccountsFragment = gql(`
  fragment UserAltAccountsFragment on User {
    ...SunshineUsersList
    IPs
  }
`)

export const SharedUserBooleans = gql(`
  fragment SharedUserBooleans on User {
    taggingDashboardCollapsed
    usernameUnset
  }
`)

// Fragment used for the map markers on /community. This is a much-larger-than-
// usual number of users, so keep this fragment minimal.
export const UsersMapEntry = gql(`
  fragment UsersMapEntry on User {
    _id
    displayName
    username
    fullName
    slug
    mapLocationLatLng {
      lat
      lng
    }
    mapLocationSet
    htmlMapMarkerText
  }
`)


export const UsersEdit = gql(`
  fragment UsersEdit on User {
    ...UsersCurrent
    biography {
      ...RevisionEdit
    }
    # Moderation Guidelines editor information
    moderationGuidelines {
      ...RevisionEdit
    }

    # UI Settings
    markDownPostEditor
    hideElicitPredictions
    hideAFNonMemberInitialWarning
    hideIntercom
    commentSorting
    currentFrontpageFilter
    noCollapseCommentsPosts
    noCollapseCommentsFrontpage
    noSingleLineComments
    hideCommunitySection
    showCommunityInRecentDiscussion
    hidePostsRecommendations
    beta
    theme

    # Emails
    email
    whenConfirmationEmailSent
    emailSubscribedToCurated
    subscribedToDigest
    subscribedToNewsletter
    unsubscribeFromAll
    hasAuth0Id

    # Moderation
    moderatorAssistance
    collapseModerationGuidelines
    bannedUserIds
    bannedPersonalUserIds
    noKibitz
    showHideKarmaOption

    # Ban & Purge
    nullifyVotes
    deleteContent
    banned

    # Name
    username
    displayName
    fullName

    # Location
    mongoLocation
    googleLocation
    location
    
    # Map Location (public)
    mapLocation
    
    # Privacy settings
    hideFromPeopleDirectory
    allowDatadogSessionReplay

    # Admin & Review
    reviewedByUserId

    # Alignment Forum
    reviewForAlignmentForumUserId
    groups
    afApplicationText
    afSubmittedApplication

    # Karma Settings
    karmaChangeLastOpened
    karmaChangeNotifierSettings

    notificationShortformContent
    notificationCommentsOnSubscribedPost
    notificationRepliesToMyComments
    notificationRepliesToSubscribedComments
    notificationSubscribedUserPost
    notificationSubscribedUserComment
    notificationSubscribedTagPost
    notificationSubscribedSequencePost
    notificationPostsInGroups
    notificationPrivateMessage
    notificationSharedWithMe
    notificationAlignmentSubmissionApproved
    notificationEventInRadius
    notificationRSVPs
    notificationCommentsOnDraft
    notificationPostsNominatedReview
    notificationGroupAdministration
    notificationSubforumUnread
    notificationNewMention
    notificationNewDialogueChecks
    notificationYourTurnMatchForm
    notificationDialogueMessages
    notificationPublishedDialogueMessages

    hideFrontpageMap
    hideTaggingProgressBar
    hideFrontpageBookAd
    hideFrontpageBook2020Ad

    deleted
    permanentDeletionRequestedAt

    twitterProfileURLAdmin
  }
`)

export const UsersAdmin = gql(`
  fragment UsersAdmin on User {
    _id
    username
    createdAt
    isAdmin
    displayName
    email
    slug
    groups
    services
    karma
  }
`)

export const UsersWithReviewInfo = gql(`
  fragment UsersWithReviewInfo on User {
    ...UsersMinimumInfo
    reviewVoteCount
    email
  }
`)

export const UsersProfileEdit = gql(`
  fragment UsersProfileEdit on User {
    _id
    slug
    displayName
    jobTitle
    organization
    careerStage
    profileImageId
    biography {
      ...RevisionEdit
    }
    howOthersCanHelpMe {
      ...RevisionEdit
    }
    howICanHelpOthers {
      ...RevisionEdit
    }
    profileTagIds
    organizerOfGroupIds
    organizerOfGroups {
      ...localGroupsBase
    }
    programParticipation
    mapLocation
    website
    linkedinProfileURL
    facebookProfileURL
    blueskyProfileURL
    twitterProfileURL
    githubProfileURL
  }
`)

export const UsersCrosspostInfo = gql(`
  fragment UsersCrosspostInfo on User {
    _id
    username
    slug
    fmCrosspostUserId
  }
`)

export const UsersOptedInToDialogueFacilitation = gql(`
  fragment UsersOptedInToDialogueFacilitation on User {
    _id
    displayName
  }
`)

export const UserOnboardingAuthor = gql(`
  fragment UserOnboardingAuthor on User {
    _id
    displayName
    profileImageId
    karma
    jobTitle
    organization
  }
`)

export const UsersSocialMediaInfo = gql(`
  fragment UsersSocialMediaInfo on User {
    ...UsersProfile
    twitterProfileURLAdmin
  }
`)

export const SuggestAlignmentUser = gql(`
  fragment SuggestAlignmentUser on User {
    ...UsersMinimumInfo
    afKarma
    afPostCount
    afCommentCount
    reviewForAlignmentForumUserId
    groups
    afApplicationText
    afSubmittedApplication
  }
`)
