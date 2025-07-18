import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import classNames from 'classnames';
import orderBy from 'lodash/orderBy';
import { createPortal } from 'react-dom';
import { useHover } from '@/components/common/withHover';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { getOffsetChainTop } from '@/lib/utils/domUtil';
import { defineStyles, useStyles } from '../hooks/useStyles';

export type SideItemOptions = {
  format: "block"|"icon",
  offsetTop: number,
  measuredElement?: React.RefObject<HTMLElement|null>,
}
const defaultSideItemOptions: SideItemOptions = {
  format: "block",
  offsetTop: 0,
};

type SideItem = {
  id: number
  anchorEl: HTMLElement
  container: HTMLElement
  options: SideItemOptions

  anchorTop: number|null
  anchorLeft: number|null
  sideItemHeight: number|null
}
type SideItemsState = {
  maxId: number
  sideItems: SideItem[]
}
type SideItemsPlacementContextType = {
  addSideItem: (anchorEl: HTMLElement, options: SideItemOptions) => HTMLDivElement
  removeSideItem: (anchorEl: HTMLElement) => void
  resizeItem: (anchorEl: HTMLElement, newHeight: number) => void
}
type SideItemsDisplayContextType = {
  sideItems: SideItem[]
};
const SideItemsPlacementContext = createContext<SideItemsPlacementContextType|null>(null);
const SideItemsDisplayContext = createContext<SideItemsDisplayContextType|null>(null);

export type SideItemContentContextType = {
};
export const SideItemContentContext = createContext<SideItemContentContextType|null>(null);

export const styles = defineStyles("SideItems", (theme: ThemeType) => ({
  sideItem: {
    position: "absolute",
    width: "100%",
  },
  sidebar: {
    position: "relative",
    height: "100%",
  },
}));

///////////////////////////////////////////////////////////////////////////

function useForceRerender() {
  const [renderCount, rerender] = useReducer(c=>c+1, 0);
  return {renderCount, rerender};
}

export const SideItemsContainer = ({children}: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  const state = useRef<SideItemsState>({sideItems: [], maxId: -1});
  const contentsRef = useRef<HTMLDivElement|null>(null);
  const {renderCount, rerender} = useForceRerender();
  
  const addSideItem = useCallback((anchorEl: HTMLElement, options: SideItemOptions) => {
    const container = document.createElement("div");
    container.setAttribute("class", classes.sideItem);
    state.current.sideItems = [...state.current.sideItems, {
      id: ++state.current.maxId,
      anchorEl, container,
      options,
      anchorTop: null, anchorLeft: null, sideItemHeight: null,
    }];
    rerender();
    return container;
  }, [rerender, classes]);
  
  const removeSideItem = useCallback((anchorEl: HTMLElement) => {
    const removedItemIndex = state.current.sideItems.findIndex(s => s.anchorEl === anchorEl);
    if (removedItemIndex >= 0) {
      const [removedItem] = state.current.sideItems.splice(removedItemIndex, 1);
      if (removedItem) {
        removedItem.container.remove();
      }
      rerender();
    }
  }, [rerender]);
  
  const resizeItem = useCallback((anchorEl: HTMLElement, newHeight: number) => {
    // Find the corresponding sideItem
    const sideItem = state.current.sideItems.find(s => s.container === anchorEl);
    
    // Compare height reported by the ResizeObserver to the last known height.
    // Round down, becauses the ResizeObserver may report a non-integer size,
    // but when we measure it with `Element.clientHeight`, it gets rounded.
    if (sideItem && sideItem.sideItemHeight && Math.abs(sideItem.sideItemHeight - newHeight) >= 1.0) {
      state.current.sideItems = [...state.current.sideItems];
      rerender();
    }
  }, [rerender]);
  
  const sideItemsPlacementContext: SideItemsPlacementContextType = useMemo(() => ({
    addSideItem, removeSideItem, resizeItem
  }), [addSideItem, removeSideItem, resizeItem]);
  
  const sideItemsDisplayContext: SideItemsDisplayContextType = useMemo(() => ({
    sideItems: state.current.sideItems
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [renderCount, state.current.sideItems]);
  
  useEffect(() => {
    // Watch contents for size-change of the central column, which will happen
    // if text reflows because browser width changed, or if the user
    // opened/closed a collapsible section, or various other things. When that
    // happens, rerender, so that the vertical positions of anchor elements are
    // rechecked.
    const contentsDiv = contentsRef.current;
    if (contentsDiv) {
      const resizeObserver = new ResizeObserver((_entries) => {
        rerender();
      });
      resizeObserver.observe(contentsDiv);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [rerender]);
  
  return (
    <SideItemsPlacementContext.Provider value={sideItemsPlacementContext}>
    <SideItemsDisplayContext.Provider value={sideItemsDisplayContext}>
      <div ref={contentsRef}>
        {children}
      </div>
    </SideItemsDisplayContext.Provider>
    </SideItemsPlacementContext.Provider>
  );
}

export const SideItemsSidebar = () => {
  const classes = useStyles(styles);
  const placementContext = useContext(SideItemsPlacementContext);
  const displayContext = useContext(SideItemsDisplayContext);
  const sideItemColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sideItemColumnRef.current) return;
    if (!displayContext) return;
    
    const sidebarColumnTop = getOffsetChainTop(sideItemColumnRef.current);

    // Place all the side-items in the container, without yet handling their
    // positioning. This makes it possible to measure their heights (which may
    // depend on the width of the column).
    for (const sideItem of displayContext.sideItems) {
      if (sideItem.container.parentNode === sideItemColumnRef.current) {
        continue;
      }
      if (sideItem.container.parentNode !== null) {
        sideItem.container.remove();
      }
      sideItemColumnRef.current.appendChild(sideItem.container);
    }
    
    // Measure side-item anchor positions and element heights
    // (Note that it's important to do the measurement all at once, and not
    // alternate between measuring and editing the DOM, for performance
    // reasons, as each edit invalidates layout and each measurement triggers
    // reflow if layout is invalidated.)
    for (let i=0; i<displayContext.sideItems.length; i++) {
      const sideItem = displayContext.sideItems[i];
      sideItem.anchorTop = getOffsetChainTop(sideItem.anchorEl) - sidebarColumnTop + sideItem.options.offsetTop;
      sideItem.anchorLeft = sideItem.anchorEl.offsetLeft;
      sideItem.sideItemHeight = sideItem.options.measuredElement?.current?.clientHeight ?? sideItem.container.clientHeight;
    }
    
    // Sort side-items by their anchor position
    const sortedSideItems = orderBy(displayContext.sideItems,
      [s => s.anchorTop, s => s.anchorLeft]
    );
    
    // Place them vertically
    let top = 0;
    for (let i=0; i<sortedSideItems.length; i++) {
      const sideItem = sortedSideItems[i];
      let newTop = Math.max(top, sideItem.anchorTop!);

      const sidebarColumnHeight = sideItemColumnRef.current?.clientHeight;

      const style = `top:${newTop}px; --sidebar-column-remaining-height: ${sidebarColumnHeight - newTop}px`;

      sideItem.container.setAttribute("style", style);
      top = newTop + sideItem.sideItemHeight!;  
    }
    
    // Use a ResizeObserver to watch for size-changes of side-item containers
    const resizeObserver = new ResizeObserver((entries) => {
      if (placementContext) {
        for (let entry of entries) {
          placementContext.resizeItem(entry.target as HTMLElement, entry.contentRect.height);
        }
      }
    });
    for (const sideItem of displayContext.sideItems) {
      resizeObserver.observe(sideItem.container);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [displayContext, placementContext]);

  return useMemo(() => <div
    className={classes.sidebar}
    ref={sideItemColumnRef}
  />, [classes]);
}

export const SideItem = ({options, children}: {
  options?: Partial<SideItemOptions>,
  children: React.ReactNode
}) => {
  const placementContext = useContext(SideItemsPlacementContext);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement|null>(null);
  const mergedOptions: SideItemOptions = {...defaultSideItemOptions, ...options};
  
  useEffect(() => {
    if (placementContext && anchorRef.current) {
      const anchor = anchorRef.current;
      setPortalContainer(placementContext.addSideItem(anchor, mergedOptions));
      
      return () => {
        placementContext.removeSideItem(anchor);
        setPortalContainer(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementContext, mergedOptions.format, mergedOptions.offsetTop, mergedOptions.measuredElement]);

  if (!placementContext) {
    return null;
  }

  return <span ref={anchorRef}>
    {portalContainer && createPortal(children, portalContainer)}
  </span>
}

export const useHasSideItemsSidebar = (): boolean => {
  return !!useContext(SideItemsPlacementContext);
}

export const NoSideItems = ({children}: {
  children: React.ReactNode
}) => {
  return <SideItemsPlacementContext.Provider value={null}>
    <SideItemsDisplayContext.Provider value={null}>
      {children}
    </SideItemsDisplayContext.Provider>
  </SideItemsPlacementContext.Provider>
}

