import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { debateEditorPlaceholder, defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, linkpostEditorPlaceholder, questionEditorPlaceholder } from '../../lib/editor/make_editable';
import { getLSHandlers, getLSKeyPrefix } from '../editor/localStorageHandlers';
import { userCanCreateCommitMessages, userHasPostAutosave } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { Editor, EditorChangeEvent, getUserDefaultEditor, getInitialEditorContents, getBlankEditorContents, EditorContents, isBlank, serializeEditorContents, EditorTypeString, styles, FormProps, shouldSubmitContents, isValidEditorType, type LegacyEditorTypeString } from './Editor';
import withErrorBoundary from '../common/withErrorBoundary';
import * as _ from 'underscore';
import { useLazyQuery, useMutation } from '@apollo/client';
import { gql } from "@/lib/generated/gql-codegen";
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import Transition from 'react-transition-group/Transition';
import { useTracking } from '../../lib/analyticsEvents';
import { PostCategory } from '../../lib/collections/posts/helpers';
import { DynamicTableOfContentsContext } from '../posts/TableOfContents/DynamicTableOfContents';
import isEqual from 'lodash/isEqual';
import { useDebouncedCallback, useStabilizedCallback } from '../hooks/useDebouncedCallback';
import { useMessages } from '../common/withMessages';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE } from '@/lib/cookies/cookies';
import { CKEditorPortalProvider } from '../editor/CKEditorPortalProvider';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import LastEditedInWarning from "./LastEditedInWarning";
import LocalStorageCheck from "./LocalStorageCheck";
import EditorTypeSelect from "./EditorTypeSelect";
import PostsEditBotTips from "../posts/PostsEditBotTips";
import ErrorBoundary from "../common/ErrorBoundary";
import PostVersionHistoryButton from './PostVersionHistory';

const autosaveInterval = 3000; //milliseconds
const remoteAutosaveInterval = 1000 * 60 * 5; // 5 minutes in milliseconds

type AutosaveFunc = () => Promise<void>;
interface AutosaveEditorStateContext {
  autosaveEditorState: AutosaveFunc | null;
  /**
   * WARNING: since `setAutosaveEditorState` is a React setState function,
   * passing in a function seems to cause it to interpret it as the (prevValue: T): T => newValue form,
   * so you actually need to pass in with an additional closure if you want to update `autosaveEditorState` with a new function:
   * 
   * (prevValue: T) => (): T => { ...;  return newValue; }
   */
  setAutosaveEditorState: React.Dispatch<React.SetStateAction<AutosaveFunc | null>>;
}

export const AutosaveEditorStateContext = React.createContext<AutosaveEditorStateContext>({
  autosaveEditorState: null,
  setAutosaveEditorState: _ => {},
});

export function isCollaborative(post: Pick<DbPost | PostsBase, '_id' | 'shareWithUsers' | 'sharingSettings' | 'collabEditorDialogue'>, fieldName: string): boolean {
  if (!post) return false;
  if (!post._id) return false;
  if (fieldName !== "contents") return false;
  if (!!post.shareWithUsers?.length) return true;
  if (post.sharingSettings?.anyoneWithLinkCan && post.sharingSettings.anyoneWithLinkCan !== "none")
    return true;
  if (post.collabEditorDialogue) return true;
  return false;
}

const getPostPlaceholder = (post: PostsBase) => {
  const { question, postCategory } = post;
  const effectiveCategory = question ? "question" as const : postCategory as PostCategory;

  if (post.debate) return debateEditorPlaceholder; // note: this version of debates are deprecated in favor of post.collabEditorDialogue
  if (effectiveCategory === "question") return questionEditorPlaceholder;
  if (effectiveCategory === "linkpost") return linkpostEditorPlaceholder;
  return defaultEditorPlaceholder;
};

const definedStyles = defineStyles('EditorFormComponent', styles);

type EditorSubmitCallback = () => Promise<void>;
type EditorSuccessCallback<R> = (result: R, submitOptions?: { redirectToEditor?: boolean; noReload?: boolean }) => void;

interface EditorFormComponentProps<S, R> {
  field: TypedFieldApi<any>;
  commentEditor?: boolean;
  commentStyles?: boolean;
  commentMinimalistStyle?: boolean;
  collectionName: CollectionNameString;
  hideControls?: boolean;
  formType: 'new' | 'edit';
  editorHintText?: string;
  maxHeight?: boolean;
  document: any;
  name: string;
  fieldName: string;
  hintText: string;
  placeholder?: string;
  label?: string;
  formVariant?: 'default' | 'grey';
  revisionsHaveCommitMessages?: boolean;
  hasToc?: boolean;
  setFieldEditorType?: (editorType: EditorTypeString) => void;
  addOnSubmitCallback: (fn: EditorSubmitCallback) => () => void;
  addOnSuccessCallback: (fn: EditorSuccessCallback<R>) => () => void;
  getLocalStorageId?: (doc: any, name: string) => { id: string, verify: boolean }
}

export function useEditorFormCallbacks<R>() {
  const onSubmitCallback = useRef<EditorSubmitCallback | null>(null);
  const onSuccessCallback = useRef<EditorSuccessCallback<R> | null>(null);

  const addOnSubmitCallback = (cb: EditorSubmitCallback) => {
    onSubmitCallback.current = cb;
    return () => {
      onSubmitCallback.current = null;
    };
  };

  const addOnSuccessCallback = (cb: EditorSuccessCallback<R>) => {
    onSuccessCallback.current = cb;
    return () => {
      onSuccessCallback.current = null;
    };
  };

  return {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback,
  };
};

function InnerEditorFormComponent<S, R>({
  field,
  commentEditor,
  commentStyles,
  commentMinimalistStyle,
  collectionName,
  hideControls,
  formType,
  editorHintText,
  maxHeight,
  document,
  name,
  fieldName,
  hintText,
  placeholder,
  label,
  formVariant,
  revisionsHaveCommitMessages,
  hasToc,
  setFieldEditorType,
  addOnSubmitCallback,
  addOnSuccessCallback,
  getLocalStorageId,
}: EditorFormComponentProps<S, R>) {
  const classes = useStyles(definedStyles);
  const { flash } = useMessages();
  const currentUser = useCurrentUser();
  const editorRef = useRef<Editor|null>(null);
  const hasUnsavedDataRef = useRef({hasUnsavedData: false});
  const isCollabEditor = collectionName === 'Posts' && isCollaborative(document, fieldName);
  const { captureEvent } = useTracking()

  const localStorageIdGenerator = getLocalStorageId ?? getDefaultLocalStorageIdGenerator(collectionName);

  const getLocalStorageHandlers = useCallback((editorType: EditorTypeString) => {
    return getLSHandlers(localStorageIdGenerator, document, name,
      getLSKeyPrefix(editorType)
    );
  }, [document, localStorageIdGenerator, name]);

  const getNewPostLocalStorageHandlers = useCallback((editorType: EditorTypeString) => {
    // It would be nice to check that it's a post and not a comment, but it should be fine
    // in comments as well, because there should always be content when editing a comment
    // (which we check later).
    if (formType !== "edit" || document.contents_latest || document.title !== 'Untitled Draft') {
      return {
        get: () => null,
        set: () => {},
        reset: () => {},
      };
    }
    // pass in {_id: null} to getLocalStorageId to treat this like a new post, without having to change how makeEditableOptions works
    const getLocalStorageId = (_: AnyBecauseIsInput, name: string) => localStorageIdGenerator({ _id: null }, name);
    return getLSHandlers(getLocalStorageId, document, name, getLSKeyPrefix(editorType));
  }, [document, name, localStorageIdGenerator, formType]);

  const [contents,setContents] = useState(() => getInitialEditorContents(
    field.state.value, document, fieldName, currentUser
  ));

  const autosaveContentsRef = useRef(contents);
  const [initialEditorType] = useState(contents.type);
  const [updatedFormType, setUpdatedFormType] = useState(formType);

  const dynamicTableOfContents = useContext(DynamicTableOfContentsContext)
  const { setAutosaveEditorState } = useContext(AutosaveEditorStateContext);

  const defaultEditorType = getUserDefaultEditor(currentUser);
  const currentEditorType = contents.type || defaultEditorType;

  // We used to show this warning to a variety of editor types, but now we only want
  // to show it to people using the html editor. Converting from markdown to ckEditor
  // is error prone and we don't want to encourage it. We no longer support draftJS
  // but some old posts still are using it so we show the warning for them too.
  const showEditorWarning = (updatedFormType !== "new") && (currentEditorType === 'html' || (currentEditorType as LegacyEditorTypeString) === 'draftJS')
  
  // On the EA Forum, our bot checks if posts are potential criticism,
  // and if so we show a little card with tips on how to make it more likely to go well.
  const [postFlaggedAsCriticism, setPostFlaggedAsCriticism] = useState<boolean>(false)
  const [criticismTipsDismissed, setCriticismTipsDismissed] = useState<boolean>(!!currentUser?.criticismTipsDismissed)
  const tipsNodeRef = useRef<HTMLElement|null>(null);
  const updateCurrentUser = useUpdateCurrentUser()
  
  const handleDismissCriticismTips = () => {
    // hide the card
    setCriticismTipsDismissed(true)
    captureEvent('criticismTipsDismissed', {postId: document._id})
    // make sure not to show the card for this user ever again
    void updateCurrentUser({
      criticismTipsDismissed: true
    })
  }
  
  const [checkPostIsCriticism] = useLazyQuery(gql(`
    query getPostIsCriticism($args: JSON) {
      PostIsCriticism(args: $args)
    }
    `), {
      onCompleted: (data) => {
        // SC 2024-09-18: We are temporarily hiding the user-facing card,
        // as we are testing using gpt-4o-mini directly instead of a fine-tuned model.
        
        // const isCriticism = !!data.PostIsCriticism
        // setPostFlaggedAsCriticism(isCriticism)
        // if (isCriticism && !postFlaggedAsCriticism) {
        //   captureEvent('criticismTipsShown', {postId: document._id})
        // }
      }
    }
  )

  const [cookies] = useCookiesWithConsent([HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE]);

  // On the EA Forum, our bot checks if posts are potential criticism,
  // and if so we show a little card with tips on how to make it more likely to go well.
  const checkIsCriticism = useCallback((contents: EditorContents) => {
    // The "Useful links" card appears on the "new post" form by default,
    // in the same area as the criticism tips card. If the user hasn't dismissed it,
    // then we don't bother to show the criticism tips card.
    const conflictingCardVisible = updatedFormType === 'new' && cookies[HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE] !== 'true'
    // We're currently skipping linkposts, since the linked post's author is
    // not always the same person posting it on the forum.
    if (
      !isEAForum ||
      collectionName !== 'Posts' ||
      conflictingCardVisible ||
      document.isEvent ||
      document.debate ||
      document.shortform ||
      document.url ||
      criticismTipsDismissed
    ) return

    void checkPostIsCriticism({variables: { args: {
      _id: document._id,
      title: document.title ?? '',
      contentType: contents.type,
      body: contents.value
    }}})
  }, [
    collectionName,
    updatedFormType,
    cookies,
    document._id,
    document.isEvent,
    document.debate,
    document.shortform,
    document.url,
    document.title,
    criticismTipsDismissed,
    checkPostIsCriticism
  ])

  // Run this check up to once per 20 min.
  const throttledCheckIsCriticism = useDebouncedCallback(checkIsCriticism, {
    rateLimitMs: 1000*60*20,
    callOnLeadingEdge: true,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  });
  // Run this check up to once per 2 min (called only when there is a significant amount of text added).
  const throttledCheckIsCriticismLargeDiff = useDebouncedCallback(checkIsCriticism, {
    rateLimitMs: 1000*60*2,
    callOnLeadingEdge: true,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  })
  
  useEffect(() => {
    // check when loading the post edit form
    if (contents?.value?.length > 300) {
      throttledCheckIsCriticism(contents)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const saveBackup = useCallback((newContents: EditorContents) => {
    const sameAsSaved = newContents.value === document?.[fieldName]?.ckEditorMarkup

    if (isBlank(newContents) || sameAsSaved) {
      getLocalStorageHandlers(currentEditorType).reset();
      hasUnsavedDataRef.current.hasUnsavedData = false;
    } else {
      const serialized = serializeEditorContents(newContents);
      const success = getLocalStorageHandlers(newContents.type).set(serialized);
      
      if (success) {
        hasUnsavedDataRef.current.hasUnsavedData = false;
      }
    }
  }, [getLocalStorageHandlers, currentEditorType, document, fieldName]);

  const [autosaveRevision] = useMutation(gql(`
    mutation autosaveRevision($postId: String!, $contents: AutosaveContentType!) {
      autosaveRevision(postId: $postId, contents: $contents) {
        ...RevisionEdit
      }
    }
  `));

  const saveRemoteBackup = useCallback(async (newContents: EditorContents): Promise<void> => {
    // If a post hasn't ever been saved before, "submit" the form in order to create a draft post
    // Afterwards, check whatever revision was loaded for display
    // This may or may not be the most recent one) against current content
    // If different, save a new revision
    if (userHasPostAutosave(currentUser) && collectionName === 'Posts' && fieldName === 'contents' && !isEqual(autosaveContentsRef.current, newContents)) {
      // In order to avoid recreating this function (which is throttled) each time the contents change,
      // we need to use a ref rather than using the `contents` directly.  We also need to update it here,
      // rather than e.g. in `wrappedSetContents`, since updating it there would result in the `isEqual` always returning true
      autosaveContentsRef.current = newContents;
      await autosaveRevision({
        variables: { postId: document._id, contents: newContents }
      });
    }
  }, [currentUser, collectionName, fieldName, document._id, autosaveRevision]);

  /**
   * Update the edited field (e.g. "contents") so that other form components can access the updated value. The direct motivation for this
   * was for SocialPreviewUpload, which needs to know the body of the post in order to generate a preview description and image.
   */
  const throttledSetContentsValue = useDebouncedCallback(async (_: {}) => {
    if (!(editorRef.current && shouldSubmitContents(editorRef.current))) return
    
    // Preserve other fields in "contents" which may have been sent from the server
    const newFieldValue = {
      ...(document[fieldName] || {}),
      ...(await editorRef.current.submitData()),
    };
    
    field.handleChange(newFieldValue);
  }, {
    rateLimitMs: autosaveInterval,
    callOnLeadingEdge: true,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  });

  const throttledSaveBackup = useDebouncedCallback(saveBackup, {
    rateLimitMs: autosaveInterval,
    callOnLeadingEdge: false,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  });

  const throttledSaveRemoteBackup = useDebouncedCallback(saveRemoteBackup, {
    rateLimitMs: remoteAutosaveInterval,
    callOnLeadingEdge: false,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  });
  
  const wrappedSetContents = useStabilizedCallback((change: EditorChangeEvent) => {
    const {contents: newContents, autosave} = change;
    if (dynamicTableOfContents && hasToc) {
      dynamicTableOfContents.setToc(change.contents);
    }
    setContents(newContents);
    
    // Only save to localStorage if not using collaborative editing, since with
    // collaborative editing stuff is getting constantly sent through a
    // websocket and saved that way.
    if (!isCollabEditor) {
      if (!isBlank(newContents)) {
        hasUnsavedDataRef.current.hasUnsavedData = true;
      }
    }
    
    // Update the parent form's state with the editor type on every keystroke, to enable other
    // form components (in particular PostSharingSettings) to check whether we're
    // using CkEditor vs draftjs vs etc. Update the actual contents with a throttled
    // callback to improve performance. Note that the contents are always recalculated on
    // submit anyway, setting them here is only for the benefit of other form components (e.g. SocialPreviewUpload)
    setFieldEditorType?.(newContents?.type)
    void throttledSetContentsValue({})
    
    if (autosave) {
      throttledSaveBackup(newContents);
      // Don't do server-side autosave if using the collaborative editor, since it autosaves through the ckEditor webhook
      if (!isCollabEditor) void throttledSaveRemoteBackup(newContents);
    }
    
    // We only check posts that have >300 characters, which is ~a few sentences.
    if (newContents?.value?.length > 300) {
      // If there's a lot more text (ex. something pasted in), we check the post sooner.
      if (newContents.value.length - (contents?.value?.length ?? 0) > 300) {
        throttledCheckIsCriticismLargeDiff(newContents)
      } else {
        throttledCheckIsCriticism(newContents)
      }
    }
  });
  
  const hasGeneratedFirstToC = useRef({generated: false});
  useEffect(() => {
    if (dynamicTableOfContents && contents && !hasGeneratedFirstToC.current.generated && hasToc) {
      dynamicTableOfContents.setToc(contents);
      hasGeneratedFirstToC.current.generated = true;
    }
  }, [contents, dynamicTableOfContents, hasToc]);

  useEffect(() => {
    const unloadEventListener = (ev: BeforeUnloadEvent) => {
      if (hasUnsavedDataRef?.current?.hasUnsavedData) {
        ev.preventDefault();
        ev.returnValue = 'Are you sure you want to close?';
        return ev.returnValue
      }
    };
    
    window.addEventListener("beforeunload", unloadEventListener);
    return () => {
      window.removeEventListener("beforeunload", unloadEventListener);
    };
  }, [fieldName, hasUnsavedDataRef]);
  
  const onRestoreLocalStorage = useCallback((newState: EditorContents) => {
    if (isCollabEditor) {
      // If in collab editing mode, we can't edit the editor contents.
      flash("Restoring from local storage is not supported in the collaborative editor. Use the Version History button to restore old versions.");
    } else {
      wrappedSetContents({contents: newState, autosave: false});
      // TODO: Focus editor
    }
  }, [wrappedSetContents, flash, isCollabEditor]);

  const onRestoreNewPostLegacy = useCallback((newState: EditorContents) => {
    if (isCollabEditor) {
      // If in collab editing mode, we can't edit the editor contents.
      flash("Restoring from local storage is not supported in the collaborative editor. Use the Version History button to restore old versions.");
    } else {
      wrappedSetContents({contents: newState, autosave: false});
      getNewPostLocalStorageHandlers(currentEditorType).reset();
      // TODO: Focus editor
    }
  }, [wrappedSetContents, flash, isCollabEditor, currentEditorType, getNewPostLocalStorageHandlers]);
  
  
  useEffect(() => {
    if (editorRef.current) {
      const cleanupSubmitForm = addOnSubmitCallback(async () => {
        if (editorRef.current && shouldSubmitContents(editorRef.current)) {
          const updatedEditorData = await editorRef.current.submitData();
          field.setValue(updatedEditorData);
        }
      });
      const cleanupSuccessForm = addOnSuccessCallback((result: R, submitOptions?: { redirectToEditor?: boolean; noReload?: boolean }) => {
        getLocalStorageHandlers(currentEditorType).reset();
        // If we're autosaving (noReload: true), don't clear the editor!  Also no point in clearing it if we're getting redirected anyways
        if (editorRef.current && (!submitOptions?.redirectToEditor && !submitOptions?.noReload) && !isCollabEditor) {

          // We have to adjust for a timing issue here that caused text to
          // persist in the comment box if you submit the form too quickly.
          // There's the visible state that the user can see, and there's the
          // state tracked in the Editor component (which is tracked in this
          // component as `contents` and updated with wrappedSetContents — see
          // the getInitialEditorContents hook), and they're different. The
          // Editor component state is updated to the visible state after a
          // debounce period of not typing (i.e. the autosaveInterval, currently
          // 3 seconds). In this cleanupSuccessForm function, we want to clear
          // the text field, which you'd ordinarily do by calling
          // wrappedSetContents with a blank contents. But the timing issue is:
          // if they submit the form without ever having paused typing for 3
          // seconds, the Editor component state (`contents`) will still be
          // empty, so if we set it to empty here (by setting it to
          // getBlankEditorContents), it won't trigger the onChange handler,
          // which is where the debounced state change is triggered, so the
          // visible-to-user state will remain and then get auto-saved. So if
          // we've submitted the form and the contents seems to be empty, we set
          // it to a dummy value and *then* set it to empty, to make sure that
          // onChange handler gets triggered.

          if (contents.value.length === 0) {
            wrappedSetContents({
              contents: {type: initialEditorType, value: 'dummy value to trigger onChange handler'},
              autosave: false,
            });
          }
          wrappedSetContents({
            contents: getBlankEditorContents(initialEditorType),
            autosave: false,
          });
        }
        return result;
      });
      return () => {
        cleanupSubmitForm();
        cleanupSuccessForm();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editorRef.current, fieldName, initialEditorType, addOnSuccessCallback, addOnSubmitCallback]);
  
  const fieldHasCommitMessages = revisionsHaveCommitMessages;
  const hasCommitMessages = fieldHasCommitMessages
    && currentUser && userCanCreateCommitMessages(currentUser)
    && (collectionName!=="Tags" || updatedFormType==="edit");

  const actualPlaceholder = ((collectionName === "Posts" && getPostPlaceholder(document)) || editorHintText || hintText || placeholder);

  useEffect(() => {
    if (!isCollabEditor && collectionName === 'Posts' && fieldName === 'contents') {
      setAutosaveEditorState((_) => () => new Promise((resolve, reject) => {
        if (editorRef.current && shouldSubmitContents(editorRef.current)) {
          void editorRef.current?.submitData()
            .then(({ originalContents: { type, data: value } }) => ({ type, value }))
            .then(saveRemoteBackup)
            .then(resolve)
            .catch(reject);
        }
      }));
    }

    return () => {
      setAutosaveEditorState(null);
    }
  }, [isCollabEditor, collectionName, fieldName, saveRemoteBackup, setAutosaveEditorState]);

  if (!document) return null;

  return <div className={classes.root}>
    {showEditorWarning && 
      <LastEditedInWarning
        autoConvert={(contents.type as LegacyEditorTypeString) === 'draftJS'}
        initialType={initialEditorType}
        currentType={contents.type}
        defaultType={defaultEditorType}
        value={contents} setValue={wrappedSetContents}
      />
    }
    {!isCollabEditor && <LocalStorageCheck
      getLocalStorageHandlers={getLocalStorageHandlers}
      onRestore={onRestoreLocalStorage}
      onRestoreNewPostLegacy={onRestoreNewPostLegacy}
      getNewPostLocalStorageHandlers={getNewPostLocalStorageHandlers}
    />}
    <CKEditorPortalProvider>
    {isValidEditorType(contents.type) && <Editor
      ref={editorRef}
      _classes={classes}
      currentUser={currentUser}
      label={label}
      formVariant={formVariant}
      formType={updatedFormType}
      documentId={document._id}
      collectionName={collectionName}
      fieldName={fieldName}
      formProps={{ maxHeight, commentMinimalistStyle }}
      isCollaborative={isCollabEditor}
      accessLevel={document.myEditorAccess}
      value={contents}
      onChange={wrappedSetContents}
      placeholder={actualPlaceholder}
      commentStyles={commentStyles}
      answerStyles={document.answer}
      questionStyles={document.question}
      commentEditor={commentEditor}
      hideControls={hideControls}
      maxHeight={maxHeight}
      hasCommitMessages={hasCommitMessages ?? undefined}
      document={document}
    />}
    </CKEditorPortalProvider>
    {!hideControls && formVariant !== "grey" && (
      <EditorTypeSelect value={contents} setValue={wrappedSetContents} isCollaborative={isCollabEditor}/>
    )}
    {!hideControls && collectionName==="Posts" && fieldName==="contents" && !!document._id && (
      <PostVersionHistoryButton
        post={document}
        postId={document._id}
      />
    )}
    <Transition in={postFlaggedAsCriticism && !criticismTipsDismissed} timeout={0} mountOnEnter unmountOnExit appear nodeRef={tipsNodeRef}>
      {(state) => <PostsEditBotTips
        handleDismiss={handleDismissCriticismTips}
        postId={document._id}
        nodeRef={tipsNodeRef}
        className={classes[`${state}BotTips`]}
      />}
    </Transition>
  </div>
}

export function EditorFormComponent<S, R>(props: EditorFormComponentProps<S, R>) {
  const { field, formType, ...rest } = props;
  if (typeof field.state.value !== 'object' && formType === 'edit') {
    return null;
  }

  return <ErrorBoundary>
    <InnerEditorFormComponent<S, R> {...{ field, formType, ...rest }} />
  </ErrorBoundary>;
}
